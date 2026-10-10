import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { DataService } from '../services/dataService';
import { personSchema } from '../validators';
import { getCurrentUser, canManagePeople, canIssueCertificates, canManageSettings, canManageUsers, canManageApiKeys } from './authHelper';
import { generateOfficialCertificatePdf } from '../services/pdfCertificateService';
import { generateOfficialOfferLetterPdf } from '../services/pdfOfferLetterService';
import { generateOfficialEmployeeAgreementPdf } from '../services/pdfEmployeeAgreementService';
import { getTursoClient } from '../lib/turso';

const app = new Hono();

// === AUTH ===
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password, role } = await c.req.json();
    if (!email) {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Verification for Samyak Singh
    if (normalizedEmail === 'samyaksingh1845@gmail.com') {
      const trimmedPass = String(password || '').trim();
      if (trimmedPass !== 'samyaksingh1845@gmail.com') {
        return c.json({ success: false, error: 'Invalid password. Password must be your Gmail address.' }, 401);
      }
    }

    let assignedRole = 'OWNER';

    if (normalizedEmail === 'samyaksingh1845@gmail.com') {
      assignedRole = 'ADMIN';
      // Ensure Samyak Singh profile is saved in DB with ADMIN role
      try {
        const db = getTursoClient();
        await db.execute({
          sql: `INSERT INTO profiles (id, email, full_name, role, is_active, created_at, updated_at)
                VALUES ('admin-profile-samyak', 'samyaksingh1845@gmail.com', 'Samyak Singh', 'ADMIN', 1, datetime('now'), datetime('now'))
                ON CONFLICT(email) DO UPDATE SET role = 'ADMIN', full_name = 'Samyak Singh', updated_at = datetime('now');`,
          args: [],
        });
      } catch (e) {
        console.warn('Profile sync warning for Samyak Singh:', e);
      }
    } else {
      try {
        const db = getTursoClient();
        const res = await db.execute({
          sql: 'SELECT role FROM profiles WHERE lower(email) = lower(?) LIMIT 1',
          args: [normalizedEmail],
        });
        if (res.rows.length > 0 && res.rows[0].role) {
          assignedRole = String(res.rows[0].role);
        } else {
          assignedRole = role || (normalizedEmail.includes('admin') ? 'ADMIN' : normalizedEmail.includes('manager') ? 'PEOPLE_MANAGER' : 'OWNER');
        }
      } catch {
        assignedRole = role || (normalizedEmail.includes('admin') ? 'ADMIN' : normalizedEmail.includes('manager') ? 'PEOPLE_MANAGER' : 'OWNER');
      }
    }

    setCookie(c, 'gr_auth_session', `session_${Date.now()}`, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    setCookie(c, 'gr_user_email', normalizedEmail, {
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
    console.error('Login error:', err);
    return c.json({ success: false, error: 'Authentication failed', details: err?.message || String(err) }, 500);
  }
});

app.post('/api/auth/logout', (c) => {
  deleteCookie(c, 'gr_auth_session', { path: '/' });
  deleteCookie(c, 'gr_user_email', { path: '/' });
  deleteCookie(c, 'gr_user_role', { path: '/' });
  setCookie(c, 'gr_auth_session', '', { path: '/', maxAge: 0 });
  setCookie(c, 'gr_user_email', '', { path: '/', maxAge: 0 });
  setCookie(c, 'gr_user_role', '', { path: '/', maxAge: 0 });
  return c.json({ success: true });
});

app.get('/api/auth/me', async (c) => {
  const user = await getCurrentUser(c);
  return c.json({ success: true, user });
});

// === FACE BIOMETRIC AUTHENTICATION ===
app.get('/api/auth/face-accounts', async (c) => {
  try {
    const accounts = await DataService.getEnrolledFaceAccounts();
    return c.json({ success: true, accounts });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/auth/face-enroll', async (c) => {
  try {
    const { email, full_name, role, descriptor, thumbnail_url } = await c.req.json();
    if (!email || !descriptor || !Array.isArray(descriptor)) {
      return c.json({ success: false, error: 'Email and 128-d face descriptor vector are required' }, 400);
    }

    const result = await DataService.enrollFaceCredential({
      email,
      full_name: full_name || email.split('@')[0],
      role,
      descriptor,
      thumbnail_url,
    });

    return c.json({ success: true, message: 'Face successfully enrolled for user account', result });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Face enrollment failed' }, 500);
  }
});

app.delete('/api/auth/face-enroll/:email', async (c) => {
  try {
    const email = c.req.param('email');
    await DataService.deleteFaceCredential(email);
    return c.json({ success: true, message: 'Face credential removed' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
app.post('/api/auth/face-login', async (c) => {
  try {
    const { descriptor, preferredEmail } = await c.req.json();
    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return c.json({ success: false, error: 'A valid 128-dimensional face descriptor is required' }, 400);
    }

    const verification = await DataService.verifyFaceLogin(descriptor, preferredEmail);
    if (!verification.matched || !verification.user) {
      return c.json({
        success: false,
        error: verification.error || 'Face not recognized. Please try again or use password.',
        similarityPercent: verification.similarityPercent || 0,
      }, 401);
    }

    const user = verification.user;

    // Set authentication session cookies
    setCookie(c, 'gr_auth_session', `session_face_${Date.now()}`, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    setCookie(c, 'gr_user_email', user.email.toLowerCase(), {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    });

    setCookie(c, 'gr_user_role', user.role, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    });

    return c.json({
      success: true,
      user,
      similarityPercent: verification.similarityPercent,
      redirect: '/dashboard',
    });
  } catch (err: any) {
    console.error('Face login error:', err);
    return c.json({ success: false, error: 'Face authentication failed', details: err?.message }, 500);
  }
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

const handleUpdatePerson = async (c: any) => {
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
};

app.put('/api/people/:id', handleUpdatePerson);
app.patch('/api/people/:id', handleUpdatePerson);

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

app.post('/api/people/:id/promote-to-employee', async (c) => {
  try {
    const id = c.req.param('id');
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized to promote interns' }, 403);
    }

    const body = await c.req.json().catch(() => ({}));
    const result = await DataService.promoteInternToEmployee(id, body, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, person: result.person, newCard: result.newCard });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to promote intern to employee' }, 400);
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

    const { personId, person_id, valid_from, valid_until } = await c.req.json();
    const targetPersonId = personId || person_id;
    if (!targetPersonId) {
      return c.json({ success: false, error: 'Person ID required' }, 400);
    }

    const card = await DataService.generateIdCard(
      targetPersonId,
      {
        id: currentUser.id,
        name: currentUser.full_name,
      },
      valid_from || valid_until ? { valid_from, valid_until } : undefined
    );

    return c.json({ success: true, card });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to issue ID card' }, 400);
  }
});

app.post('/api/id-cards/update-dates', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized to modify ID cards' }, 403);
    }

    const { cardId, card_id, valid_from, valid_until } = await c.req.json();
    const targetCardId = cardId || card_id;
    if (!targetCardId || !valid_from || !valid_until) {
      return c.json({ success: false, error: 'Card ID, valid_from, and valid_until are required' }, 400);
    }

    const card = await DataService.updateIdCardDates(targetCardId, valid_from, valid_until, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, card });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to update ID card dates' }, 400);
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

// === OFFER LETTERS ===
app.get('/api/offer-letters', async (c) => {
  try {
    const personId = c.req.query('person_id');
    const offerLetters = await DataService.getOfferLetters(personId);
    return c.json({ success: true, offerLetters });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get('/api/offer-letters/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const offerLetter = await DataService.getOfferLetterById(id);
    if (!offerLetter) {
      return c.json({ success: false, error: 'Offer letter not found' }, 404);
    }
    const company = await DataService.getCompanySettings();
    const activityLogs = await DataService.getActivityLogsForEntity('OFFER_LETTER', offerLetter.id);
    return c.json({ success: true, offerLetter, company, activityLogs });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get('/api/offer-letters/:id/pdf', async (c) => {
  try {
    const id = c.req.param('id');
    const offerLetter = await DataService.getOfferLetterById(id);
    if (!offerLetter) {
      return c.text('Offer letter not found', 404);
    }

    const pdfBytes = await generateOfficialOfferLetterPdf(offerLetter);
    const sanitizedName = (offerLetter.recipient_name || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `GoRepireo_Offer_Letter_${sanitizedName}_${offerLetter.letter_number}.pdf`;

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error('Offer letter PDF generation error', err);
    return c.text('Failed to generate offer letter PDF', 500);
  }
});

app.post('/api/offer-letters', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized to generate offer letters' }, 403);
    }

    const body = await c.req.json();
    const offerLetter = await DataService.createOfferLetter({
      ...body,
      actor: { id: currentUser.id, name: currentUser.full_name },
    });

    return c.json({ success: true, offerLetter });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to create offer letter' }, 400);
  }
});

app.put('/api/offer-letters/:id', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized to update offer letters' }, 403);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    const offerLetter = await DataService.updateOfferLetter(id, body, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, offerLetter });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to update offer letter' }, 400);
  }
});

app.post('/api/offer-letters/:id/send', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    const id = c.req.param('id');
    const offerLetter = await DataService.markOfferLetterSent(id, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, offerLetter });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to mark offer letter as sent' }, 400);
  }
});

app.post('/api/offer-letters/:id/delete', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    const id = c.req.param('id');
    const result = await DataService.deleteOfferLetter(id, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, ...result });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to delete offer letter' }, 400);
  }
});

app.delete('/api/offer-letters/:id', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    const id = c.req.param('id');
    const result = await DataService.deleteOfferLetter(id, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, ...result });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to delete offer letter' }, 400);
  }
});

// === EMPLOYEE AGREEMENTS ===
app.get('/api/employee-agreements', async (c) => {
  try {
    const personId = c.req.query('person_id');
    const agreements = await DataService.getEmployeeAgreements(personId);
    return c.json({ success: true, agreements });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get('/api/employee-agreements/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const agreement = await DataService.getEmployeeAgreementById(id);
    if (!agreement) {
      return c.json({ success: false, error: 'Employee agreement not found' }, 404);
    }
    const company = await DataService.getCompanySettings();
    const activityLogs = await DataService.getActivityLogsForEntity('EMPLOYEE_AGREEMENT', agreement.id);
    return c.json({ success: true, agreement, company, activityLogs });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get('/api/employee-agreements/:id/pdf', async (c) => {
  try {
    const id = c.req.param('id');
    const agreement = await DataService.getEmployeeAgreementById(id);
    if (!agreement) {
      return c.text('Employee agreement not found', 404);
    }

    const pdfBytes = await generateOfficialEmployeeAgreementPdf(agreement);
    const sanitizedName = (agreement.recipient_name || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `GoRepireo_Agreement_${sanitizedName}_${agreement.agreement_number}.pdf`;

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error('Employee agreement PDF generation error', err);
    return c.text('Failed to generate employee agreement PDF', 500);
  }
});

app.post('/api/employee-agreements', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized to generate employee agreements' }, 403);
    }

    const body = await c.req.json();
    const agreement = await DataService.createEmployeeAgreement({
      ...body,
      actor: { id: currentUser.id, name: currentUser.full_name },
    });

    return c.json({ success: true, agreement });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to create employee agreement' }, 400);
  }
});

app.put('/api/employee-agreements/:id', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized to update employee agreements' }, 403);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    const agreement = await DataService.updateEmployeeAgreement(id, body, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, agreement });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to update employee agreement' }, 400);
  }
});

app.post('/api/employee-agreements/:id/send', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    const id = c.req.param('id');
    const agreement = await DataService.markEmployeeAgreementSent(id, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, agreement });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to mark employee agreement as sent' }, 400);
  }
});

app.post('/api/employee-agreements/:id/delete', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    const id = c.req.param('id');
    const result = await DataService.deleteEmployeeAgreement(id, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, ...result });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to delete employee agreement' }, 400);
  }
});

app.delete('/api/employee-agreements/:id', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManagePeople(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    const id = c.req.param('id');
    const result = await DataService.deleteEmployeeAgreement(id, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, ...result });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to delete employee agreement' }, 400);
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

app.delete('/api/departments/:id', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManageSettings(currentUser.role)) {
      return c.json({ success: false, error: 'Unauthorized' }, 403);
    }

    const id = c.req.param('id');
    await DataService.deleteDepartment(id);
    return c.json({ success: true, message: 'Department deleted successfully' });
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

// === API KEYS MANAGEMENT (OWNER ONLY) ===
app.get('/api/api-keys', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManageApiKeys(currentUser.role)) {
      return c.json({ success: false, error: 'Only owners can access and view API keys' }, 403);
    }

    const apiKeys = await DataService.getApiKeys();
    return c.json({ success: true, apiKeys });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.post('/api/api-keys', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManageApiKeys(currentUser.role)) {
      return c.json({ success: false, error: 'Only owners can create API keys' }, 403);
    }

    const { name } = await c.req.json();
    if (!name || !name.trim()) {
      return c.json({ success: false, error: 'API key name is required' }, 400);
    }

    const newKey = await DataService.createApiKey(name.trim(), {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: true, apiKey: newKey });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to create API key' }, 400);
  }
});

app.delete('/api/api-keys/:id', async (c) => {
  try {
    const currentUser = await getCurrentUser(c);
    if (!canManageApiKeys(currentUser.role)) {
      return c.json({ success: false, error: 'Only owners can delete API keys' }, 403);
    }

    const id = c.req.param('id');
    const deleted = await DataService.deleteApiKey(id, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return c.json({ success: deleted });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to delete API key' }, 400);
  }
});

// === PUBLIC CARDS API FOR EXTERNAL WEBSITES (CORS-ENABLED) ===
app.options('/api/public/cards/:identifier', (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type');
  return c.text('', 204);
});

app.get('/api/public/cards/:identifier', async (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  c.header('Cache-Control', 'public, max-age=60, s-maxage=300');
  try {
    const identifier = c.req.param('identifier');
    const url = new URL(c.req.url);
    const origin = `${url.protocol}//${url.host}`;
    const result = await DataService.getPublicCardByIdentifier(identifier, origin);
    if (!result.found) {
      return c.json(result, 404);
    }
    return c.json(result, 200);
  } catch (err: any) {
    return c.json({ success: false, found: false, error: err.message }, 500);
  }
});

app.options('/api/public/cards/:identifier/qr', (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  return c.text('', 204);
});

app.get('/api/public/cards/:identifier/qr', async (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  try {
    const identifier = c.req.param('identifier');
    const url = new URL(c.req.url);
    const origin = `${url.protocol}//${url.host}`;
    const buffer = await DataService.getPublicCardQrBuffer(identifier, origin);
    if (!buffer) {
      return c.text('QR code not found for identifier', 404);
    }
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return c.text(`Failed to generate QR: ${err.message}`, 500);
  }
});

// === PUBLIC VERIFICATION ===
app.get('/api/verify/id/:code', async (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  try {
    const code = c.req.param('code');
    const result = await DataService.verifyIdByToken(code);
    return c.json({ success: true, result });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get('/api/verify/certificate/:code', async (c) => {
  c.header('Access-Control-Allow-Origin', '*');
  try {
    const code = c.req.param('code');
    const result = await DataService.verifyCertificateByToken(code);
    return c.json({ success: true, result });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default app;

