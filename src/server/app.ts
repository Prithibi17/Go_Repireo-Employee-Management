import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { DataService } from '../services/dataService';
import { personSchema } from '../validators';
import { getCurrentUser, canManagePeople, canIssueCertificates, canManageSettings, canManageUsers } from './authHelper';
import { generateOfficialCertificatePdf } from '../services/pdfCertificateService';

const app = new Hono();

// === AUTH ===
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password, role } = await c.req.json();
    if (!email) {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }

    const assignedRole = role || (email.includes('admin') ? 'ADMIN' : email.includes('manager') ? 'PEOPLE_MANAGER' : 'OWNER');

    setCookie(c, 'gr_auth_session', `session_${Date.now()}`, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    setCookie(c, 'gr_user_email', email, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    });

    setCookie(c, 'gr_user_role', assignedRole, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    });

    return c.json({ success: true, redirect: '/dashboard' });
  } catch (err: any) {
    return c.json({ success: false, error: 'Authentication failed' }, 500);
  }
});

app.post('/api/auth/logout', (c) => {
  deleteCookie(c, 'gr_auth_session', { path: '/' });
  deleteCookie(c, 'gr_user_email', { path: '/' });
  deleteCookie(c, 'gr_user_role', { path: '/' });
  return c.json({ success: true });
});

app.get('/api/auth/me', async (c) => {
  const user = await getCurrentUser(c);
  return c.json({ success: true, user });
});

// === DASHBOARD ===
app.get('/api/dashboard/metrics', async (c) => {
  try {
    const data = await DataService.getDashboardMetrics();
    return c.json({ success: true, data });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// === PEOPLE ===
app.get('/api/people', async (c) => {
  try {
    const type = c.req.query('type');
    const dept = c.req.query('dept');
    const status = c.req.query('status');
    const search = c.req.query('search');
    const year = c.req.query('year');

    const people = await DataService.getPeople({
      type,
      departmentId: dept,
      status,
      search,
      joiningYear: year,
    });
    return c.json({ success: true, people });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/people', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized to add people' }, 403);
    }

    const body = await c.req.json();
    const validated = personSchema.parse(body);

    const person = await DataService.createPerson(validated, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, person });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to create person' }, 400);
  }
});

app.get('/api/people/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const person = await DataService.getPersonById(id);
    if (!person) {
      return c.json({ success: false, error: 'Person not found' }, 404);
    }

    const company = await DataService.getCompanySettings();
    const activityLogs = await DataService.getActivityLogsForEntity('PERSON', person.id);

    return c.json({
      success: true,
      person,
      company,
      activityLogs,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.put('/api/people/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized to modify people' }, 403);
    }

    const body = await c.req.json();
    const person = await DataService.updatePerson(id, body, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, person });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to update person' }, 400);
  }
});

app.post('/api/people/:id/archive', async (c) => {
  try {
    const id = c.req.param('id');
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized to archive people' }, 403);
    }

    const person = await DataService.archivePerson(id, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, person });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to archive person' }, 400);
  }
});

// === ID CARDS ===
app.get('/api/id-cards', async (c) => {
  try {
    const cards = await DataService.getIdCards();
    return c.json({ success: true, cards });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get('/api/id-cards/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const card = await DataService.getIdCardById(id);
    if (!card || !card.person) {
      return c.json({ success: false, error: 'ID card not found' }, 404);
    }
    const company = await DataService.getCompanySettings();
    return c.json({ success: true, card, company });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/id-cards/generate', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized to generate ID cards' }, 403);
    }

    const { personId } = await c.req.json();
    if (!personId) {
      return c.json({ success: false, error: 'Person ID required' }, 400);
    }

    const card = await DataService.generateIdCard(personId, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, card });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to issue ID card' }, 400);
  }
});

app.post('/api/id-cards/revoke', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized to revoke ID cards' }, 403);
    }

    const { cardId, reason } = await c.req.json();
    if (!cardId) {
      return c.json({ success: false, error: 'Card ID required' }, 400);
    }

    const card = await DataService.revokeIdCard(cardId, reason || 'Manually revoked by administrator', {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, card });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to revoke ID card' }, 400);
  }
});

// === CERTIFICATES ===
app.get('/api/certificates', async (c) => {
  try {
    const certificates = await DataService.getCertificates();
    return c.json({ success: true, certificates });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get('/api/certificates/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const certificate = await DataService.getCertificateById(id);
    if (!certificate) {
      return c.json({ success: false, error: 'Certificate not found' }, 404);
    }
    const company = await DataService.getCompanySettings();
    const activityLogs = await DataService.getActivityLogsForEntity('CERTIFICATE', certificate.id);
    return c.json({ success: true, certificate, company, activityLogs });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/certificates/issue', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canIssueCertificates(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized to issue certificates' }, 403);
    }

    const body = await c.req.json();
    const certificate = await DataService.issueCertificate({
      ...body,
      actor: { id: currentUser.id, name: currentUser.full_name },
    });

    return c.json({ success: true, certificate });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to issue certificate' }, 400);
  }
});

app.post('/api/certificates/revoke', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canIssueCertificates(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized to revoke certificates' }, 403);
    }

    const { certificateId, reason } = await c.req.json();
    if (!certificateId) {
      return c.json({ success: false, error: 'Certificate ID required' }, 400);
    }

    const certificate = await DataService.revokeCertificate(certificateId, reason || 'Manually revoked', {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, certificate });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to revoke certificate' }, 400);
  }
});

app.post('/api/certificates/delete', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canIssueCertificates(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized to delete certificates' }, 403);
    }

    const { certificateId } = await c.req.json();
    if (!certificateId) {
      return c.json({ success: false, error: 'Certificate ID required' }, 400);
    }

    const result = await DataService.deleteCertificate(certificateId, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, ...result });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to delete certificate' }, 400);
  }
});

app.get('/api/certificates/:id/download', async (c) => {
  try {
    const id = c.req.param('id');
    const certificate = await DataService.getCertificateById(id);
    if (!certificate) {
      return c.text('Certificate not found', 404);
    }

    const appUrl =
      process.env.VITE_APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://go-repireo-employee-management.vercel.app';

    const pdfBytes = await generateOfficialCertificatePdf(certificate, appUrl);
    const filename = `GoRepireo_Certificate_${certificate.person_code_snapshot || certificate.certificate_number}.pdf`;

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error('PDF generation error', err);
    return c.text('Failed to generate PDF', 500);
  }
});

// === INTERNSHIPS ===
app.post('/api/internships/complete', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized to complete internships' }, 403);
    }

    const body = await c.req.json();
    const internship = await DataService.completeInternship({
      ...body,
      actor: { id: currentUser.id, name: currentUser.full_name },
    });

    return c.json({ success: true, internship });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to complete internship' }, 400);
  }
});

// === DEPARTMENTS ===
app.get('/api/departments', async (c) => {
  try {
    const departments = await DataService.getDepartments();
    return c.json({ success: true, departments });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/departments', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManageSettings(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    const { name, description } = await c.req.json();
    if (!name) return c.json({ success: false, error: 'Name is required' }, 400);

    const department = await DataService.addDepartment(name, description);
    return c.json({ success: true, department });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// === SETTINGS ===
app.get('/api/settings', async (c) => {
  try {
    const settings = await DataService.getCompanySettings();
    const departments = await DataService.getDepartments();
    return c.json({ success: true, settings, departments });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.put('/api/settings', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManageSettings(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized to modify settings' }, 403);
    }

    const body = await c.req.json();
    const settings = await DataService.updateCompanySettings(body, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, settings });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to update settings' }, 400);
  }
});

app.get('/api/settings/users', async (c) => {
  try {
    const profiles = await DataService.getProfiles();
    return c.json({ success: true, profiles });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.put('/api/users/role', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManageUsers(currentUser.role)) {
      return c.json({ success: false, error: 'Only owners can modify user roles' }, 403);
    }

    const { profileId, role } = await c.req.json();
    const profile = await DataService.updateProfileRole(profileId, role, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, profile });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to update role' }, 400);
  }
});

// === PUBLIC VERIFICATION ===
app.get('/api/verify/id/:code', async (c) => {
  try {
    const code = c.req.param('code');
    const result = await DataService.verifyIdByToken(code);
    return c.json({ success: true, result });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get('/api/verify/certificate/:code', async (c) => {
  try {
    const code = c.req.param('code');
    const result = await DataService.verifyCertificateByToken(code);
    return c.json({ success: true, result });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default app;
