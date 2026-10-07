import { getTursoClient } from '@/lib/turso';
import { initTursoSchema } from '@/lib/tursoSchema';
import { generateVerificationToken, hashToken } from '@/lib/tokens';
import { 
  Person, Internship, IdCard, Certificate, ActivityLog, 
  CompanySettings, Department, Profile, PublicIdVerificationResponse, 
  PublicCertificateVerificationResponse
} from '@/types';
import { PersonFormData } from '@/validators';

let initialized = false;
async function ensureDb() {
  if (!initialized) {
    await initTursoSchema();
    initialized = true;
  }
}

export const DataService = {
  // === COMPANY SETTINGS ===
  async getCompanySettings(): Promise<CompanySettings> {
    await ensureDb();
    const db = getTursoClient();
    const res = await db.execute('SELECT * FROM company_settings LIMIT 1');
    if (res.rows.length === 0) {
      throw new Error('Company settings not found');
    }
    const row = res.rows[0];
    return {
      id: String(row.id),
      company_name: String(row.company_name),
      legal_name: row.legal_name ? String(row.legal_name) : null,
      tagline: String(row.tagline),
      logo_url: row.logo_url ? String(row.logo_url) : null,
      website: String(row.website),
      support_email: String(row.support_email),
      support_phone: row.support_phone ? String(row.support_phone) : null,
      address: row.address ? String(row.address) : null,
      id_default_validity_days: Number(row.id_default_validity_days) || 365,
      signatory_name: row.signatory_name ? String(row.signatory_name) : null,
      signatory_designation: row.signatory_designation ? String(row.signatory_designation) : null,
      signature_url: row.signature_url ? String(row.signature_url) : null,
      stamp_url: row.stamp_url ? String(row.stamp_url) : null,
      certificate_heading: String(row.certificate_heading || 'CERTIFICATE OF INTERNSHIP'),
      certificate_body_template: String(row.certificate_body_template || ''),
    };
  },

  async updateCompanySettings(updates: Partial<CompanySettings>, actor: { id?: string; name: string }): Promise<CompanySettings> {
    await ensureDb();
    const db = getTursoClient();
    const current = await this.getCompanySettings();

    const merged = { ...current, ...updates };

    await db.execute({
      sql: `UPDATE company_settings SET
        company_name = ?,
        legal_name = ?,
        tagline = ?,
        website = ?,
        support_email = ?,
        support_phone = ?,
        address = ?,
        id_default_validity_days = ?,
        signatory_name = ?,
        signatory_designation = ?,
        certificate_heading = ?,
        certificate_body_template = ?,
        updated_at = datetime('now'),
        updated_by = ?
      WHERE id = ?`,
      args: [
        merged.company_name,
        merged.legal_name || null,
        merged.tagline,
        merged.website,
        merged.support_email,
        merged.support_phone || null,
        merged.address || null,
        merged.id_default_validity_days,
        merged.signatory_name || null,
        merged.signatory_designation || null,
        merged.certificate_heading,
        merged.certificate_body_template,
        actor.id || null,
        current.id,
      ],
    });

    await this.logActivity(actor, 'SETTINGS_CHANGED', 'SETTINGS', current.id, updates);
    return merged;
  },

  // === DEPARTMENTS ===
  async getDepartments(): Promise<Department[]> {
    await ensureDb();
    const db = getTursoClient();
    const res = await db.execute('SELECT * FROM departments WHERE is_active = 1 ORDER BY display_order ASC');
    return res.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      description: row.description ? String(row.description) : null,
      display_order: Number(row.display_order),
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at),
    }));
  },

  async addDepartment(name: string, description?: string): Promise<Department> {
    await ensureDb();
    const db = getTursoClient();
    const countRes = await db.execute('SELECT count(*) as count FROM departments');
    const order = Number(countRes.rows[0].count) + 1;
    const id = `dept-${Date.now()}`;
    const createdAt = new Date().toISOString();

    await db.execute({
      sql: 'INSERT INTO departments (id, name, description, display_order, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)',
      args: [id, name, description || null, order, createdAt],
    });

    return {
      id,
      name,
      description: description || null,
      display_order: order,
      is_active: true,
      created_at: createdAt,
    };
  },

  // === PROFILES / USERS & ACCESS ===
  async getProfiles(): Promise<Profile[]> {
    await ensureDb();
    const db = getTursoClient();
    const res = await db.execute('SELECT * FROM profiles ORDER BY created_at ASC');
    return res.rows.map((row) => ({
      id: String(row.id),
      email: String(row.email),
      full_name: String(row.full_name),
      role: row.role as Profile['role'],
      is_active: Boolean(row.is_active),
      avatar_url: row.avatar_url ? String(row.avatar_url) : null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));
  },

  async updateProfileRole(profileId: string, role: Profile['role'], actor: { id?: string; name: string }): Promise<Profile> {
    await ensureDb();
    const db = getTursoClient();
    const res = await db.execute({
      sql: 'SELECT * FROM profiles WHERE id = ?',
      args: [profileId],
    });
    if (res.rows.length === 0) throw new Error('Profile not found');
    const profile = res.rows[0];

    // Prevent removing the last owner
    if (profile.role === 'OWNER' && role !== 'OWNER') {
      const ownerCount = await db.execute("SELECT count(*) as count FROM profiles WHERE role = 'OWNER' AND is_active = 1");
      if (Number(ownerCount.rows[0].count) <= 1) {
        throw new Error('Cannot remove the final owner from the system.');
      }
    }

    await db.execute({
      sql: "UPDATE profiles SET role = ?, updated_at = datetime('now') WHERE id = ?",
      args: [role, profileId],
    });

    await this.logActivity(actor, 'USER_ROLE_CHANGED', 'PROFILE', profileId, { new_role: role, email: profile.email });

    return {
      id: String(profile.id),
      email: String(profile.email),
      full_name: String(profile.full_name),
      role,
      is_active: Boolean(profile.is_active),
      avatar_url: profile.avatar_url ? String(profile.avatar_url) : null,
      created_at: String(profile.created_at),
      updated_at: new Date().toISOString(),
    };
  },

  // === SEQUENCES ===
  async getNextSequence(name: 'employee' | 'intern' | 'certificate'): Promise<number> {
    await ensureDb();
    const db = getTursoClient();

    // Verify against existing maximums in tables to ensure no number is ever reused or duplicated
    if (name === 'certificate') {
      const existingRes = await db.execute('SELECT certificate_number FROM certificates');
      let maxNum = 0;
      for (const row of existingRes.rows) {
        const match = String(row.certificate_number).match(/\/(\d+)$/);
        if (match) {
          const val = parseInt(match[1], 10);
          if (val > maxNum) maxNum = val;
        }
      }
      const seqRes = await db.execute({
        sql: 'SELECT current_value FROM app_sequences WHERE name = ?',
        args: [name],
      });
      const currentTracker = Number(seqRes.rows[0]?.current_value || 0);
      const safeBaseline = Math.max(currentTracker, maxNum);

      const nextVal = safeBaseline + 1;
      await db.execute({
        sql: 'UPDATE app_sequences SET current_value = ? WHERE name = ?',
        args: [nextVal, name],
      });
      return nextVal;
    }

    await db.execute({
      sql: 'UPDATE app_sequences SET current_value = current_value + 1 WHERE name = ?',
      args: [name],
    });
    const res = await db.execute({
      sql: 'SELECT current_value FROM app_sequences WHERE name = ?',
      args: [name],
    });
    return Number(res.rows[0].current_value);
  },

  // === PEOPLE ===
  async getPeople(options?: {
    type?: string;
    departmentId?: string;
    status?: string;
    search?: string;
    joiningYear?: string;
  }): Promise<Person[]> {
    await ensureDb();
    const db = getTursoClient();
    let query = 'SELECT p.*, d.name as dept_name FROM people p LEFT JOIN departments d ON p.department_id = d.id WHERE 1=1';
    const args: any[] = [];

    if (options?.type && options.type !== 'ALL') {
      query += ' AND p.person_type = ?';
      args.push(options.type);
    }

    if (options?.departmentId && options.departmentId !== 'ALL') {
      query += ' AND p.department_id = ?';
      args.push(options.departmentId);
    }

    if (options?.status && options.status !== 'ALL') {
      query += ' AND p.status = ?';
      args.push(options.status);
    }

    if (options?.joiningYear && options.joiningYear !== 'ALL') {
      query += ' AND p.joining_date LIKE ?';
      args.push(`${options.joiningYear}%`);
    }

    if (options?.search) {
      query += ' AND (p.full_name LIKE ? OR p.person_code LIKE ? OR p.company_email LIKE ? OR p.personal_email LIKE ? OR p.designation LIKE ?)';
      const term = `%${options.search}%`;
      args.push(term, term, term, term, term);
    }

    query += ' ORDER BY p.created_at DESC';

    const res = await db.execute({ sql: query, args });

    return res.rows.map((r) => ({
      id: String(r.id),
      person_code: String(r.person_code),
      person_type: r.person_type as any,
      full_name: String(r.full_name),
      display_name: r.display_name ? String(r.display_name) : null,
      profile_photo_path: r.profile_photo_path ? String(r.profile_photo_path) : null,
      personal_email: r.personal_email ? String(r.personal_email) : null,
      company_email: r.company_email ? String(r.company_email) : null,
      phone: r.phone ? String(r.phone) : null,
      date_of_birth: r.date_of_birth ? String(r.date_of_birth) : null,
      gender: r.gender ? String(r.gender) : null,
      address_line: r.address_line ? String(r.address_line) : null,
      city: r.city ? String(r.city) : null,
      state: r.state ? String(r.state) : null,
      postal_code: r.postal_code ? String(r.postal_code) : null,
      country: r.country ? String(r.country) : 'India',
      department_id: r.department_id ? String(r.department_id) : null,
      department: r.dept_name ? { id: String(r.department_id), name: String(r.dept_name), display_order: 0, is_active: true, created_at: '' } : null,
      designation: String(r.designation),
      joining_date: String(r.joining_date),
      reporting_manager_id: r.reporting_manager_id ? String(r.reporting_manager_id) : null,
      work_location: r.work_location ? String(r.work_location) : null,
      employment_type: r.employment_type ? (r.employment_type as any) : null,
      status: r.status as any,
      emergency_contact_name: r.emergency_contact_name ? String(r.emergency_contact_name) : null,
      emergency_contact_phone: r.emergency_contact_phone ? String(r.emergency_contact_phone) : null,
      internal_notes: r.internal_notes ? String(r.internal_notes) : null,
      created_at: String(r.created_at),
      updated_at: String(r.updated_at),
      archived_at: r.archived_at ? String(r.archived_at) : null,
      created_by: r.created_by ? String(r.created_by) : null,
      updated_by: r.updated_by ? String(r.updated_by) : null,
    }));
  },

  async getPersonById(id: string): Promise<Person | null> {
    await ensureDb();
    const db = getTursoClient();
    const res = await db.execute({
      sql: 'SELECT p.*, d.name as dept_name FROM people p LEFT JOIN departments d ON p.department_id = d.id WHERE p.id = ?',
      args: [id],
    });

    if (res.rows.length === 0) return null;
    const r = res.rows[0];

    const internshipsRes = await db.execute({
      sql: 'SELECT * FROM internships WHERE person_id = ? ORDER BY created_at DESC',
      args: [id],
    });

    const idCardsRes = await db.execute({
      sql: 'SELECT * FROM id_cards WHERE person_id = ? ORDER BY created_at DESC',
      args: [id],
    });

    const certificatesRes = await db.execute({
      sql: 'SELECT * FROM certificates WHERE person_id = ? ORDER BY created_at DESC',
      args: [id],
    });

    return {
      id: String(r.id),
      person_code: String(r.person_code),
      person_type: r.person_type as any,
      full_name: String(r.full_name),
      display_name: r.display_name ? String(r.display_name) : null,
      profile_photo_path: r.profile_photo_path ? String(r.profile_photo_path) : null,
      personal_email: r.personal_email ? String(r.personal_email) : null,
      company_email: r.company_email ? String(r.company_email) : null,
      phone: r.phone ? String(r.phone) : null,
      date_of_birth: r.date_of_birth ? String(r.date_of_birth) : null,
      gender: r.gender ? String(r.gender) : null,
      address_line: r.address_line ? String(r.address_line) : null,
      city: r.city ? String(r.city) : null,
      state: r.state ? String(r.state) : null,
      postal_code: r.postal_code ? String(r.postal_code) : null,
      country: r.country ? String(r.country) : 'India',
      department_id: r.department_id ? String(r.department_id) : null,
      department: r.dept_name ? { id: String(r.department_id), name: String(r.dept_name), display_order: 0, is_active: true, created_at: '' } : null,
      designation: String(r.designation),
      joining_date: String(r.joining_date),
      reporting_manager_id: r.reporting_manager_id ? String(r.reporting_manager_id) : null,
      work_location: r.work_location ? String(r.work_location) : null,
      employment_type: r.employment_type ? (r.employment_type as any) : null,
      status: r.status as any,
      emergency_contact_name: r.emergency_contact_name ? String(r.emergency_contact_name) : null,
      emergency_contact_phone: r.emergency_contact_phone ? String(r.emergency_contact_phone) : null,
      internal_notes: r.internal_notes ? String(r.internal_notes) : null,
      created_at: String(r.created_at),
      updated_at: String(r.updated_at),
      archived_at: r.archived_at ? String(r.archived_at) : null,
      internships: internshipsRes.rows.map((ir) => ({
        id: String(ir.id),
        person_id: String(ir.person_id),
        college_name: ir.college_name ? String(ir.college_name) : null,
        course: ir.course ? String(ir.course) : null,
        specialization: ir.specialization ? String(ir.specialization) : null,
        domain: String(ir.domain),
        internship_title: String(ir.internship_title),
        project_name: ir.project_name ? String(ir.project_name) : null,
        start_date: String(ir.start_date),
        end_date: String(ir.end_date),
        final_end_date: ir.final_end_date ? String(ir.final_end_date) : null,
        mode: ir.mode as any,
        stipend: ir.stipend ? String(ir.stipend) : null,
        status: ir.status as any,
        created_at: String(ir.created_at),
        updated_at: String(ir.updated_at),
      })),
      id_cards: idCardsRes.rows.map((cr) => ({
        id: String(cr.id),
        person_id: String(cr.person_id),
        card_number: String(cr.card_number),
        issued_at: String(cr.issued_at),
        valid_from: String(cr.valid_from),
        valid_until: String(cr.valid_until),
        status: cr.status as any,
        public_verification_code: String(cr.public_verification_code),
        template_version: Number(cr.template_version),
        created_at: String(cr.created_at),
      })),
      certificates: certificatesRes.rows.map((cert) => ({
        id: String(cert.id),
        person_id: String(cert.person_id),
        internship_id: String(cert.internship_id),
        certificate_number: String(cert.certificate_number),
        certificate_type: String(cert.certificate_type),
        issue_date: String(cert.issue_date),
        status: cert.status as any,
        public_verification_code: String(cert.public_verification_code),
        recipient_name_snapshot: String(cert.recipient_name_snapshot),
        person_code_snapshot: String(cert.person_code_snapshot),
        role_snapshot: String(cert.role_snapshot),
        department_snapshot: String(cert.department_snapshot),
        domain_snapshot: cert.domain_snapshot ? String(cert.domain_snapshot) : null,
        project_snapshot: cert.project_snapshot ? String(cert.project_snapshot) : null,
        start_date_snapshot: String(cert.start_date_snapshot),
        end_date_snapshot: String(cert.end_date_snapshot),
        template_version: Number(cert.template_version),
        issued_at: String(cert.issued_at),
        created_at: String(cert.created_at),
        updated_at: String(cert.updated_at),
      })),
    };
  },

  async createPerson(data: PersonFormData, actor: { id?: string; name: string }): Promise<Person> {
    await ensureDb();
    const db = getTursoClient();

    let personCode: string;
    if (data.person_type === 'EMPLOYEE') {
      const seq = await this.getNextSequence('employee');
      personCode = `GR-EMP-${String(seq).padStart(4, '0')}`;
    } else {
      const seq = await this.getNextSequence('intern');
      personCode = `GR-INT-${String(seq).padStart(4, '0')}`;
    }

    const newPersonId = `p-${Date.now()}`;
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO people (
        id, person_code, person_type, full_name, display_name, profile_photo_path,
        personal_email, company_email, phone, date_of_birth, gender, address_line,
        city, state, postal_code, country, department_id, designation, joining_date,
        reporting_manager_id, work_location, employment_type, status,
        emergency_contact_name, emergency_contact_phone, internal_notes,
        created_at, updated_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?)`,
      args: [
        newPersonId,
        personCode,
        data.person_type,
        data.full_name,
        data.display_name || null,
        data.profile_photo_path || null,
        data.personal_email || null,
        data.company_email || null,
        data.phone || null,
        data.date_of_birth || null,
        data.gender || null,
        data.address_line || null,
        data.city || null,
        data.state || null,
        data.postal_code || null,
        data.country || 'India',
        data.department_id || null,
        data.designation,
        data.joining_date,
        data.reporting_manager_id || null,
        data.work_location || 'Kolkata, WB',
        data.employment_type || null,
        data.emergency_contact_name || null,
        data.emergency_contact_phone || null,
        data.internal_notes || null,
        now,
        now,
        actor.id || null,
      ],
    });

    if (data.person_type === 'INTERN') {
      const intId = `int-${Date.now()}`;
      await db.execute({
        sql: `INSERT INTO internships (
          id, person_id, college_name, course, specialization, domain,
          internship_title, project_name, start_date, end_date, mode, stipend,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        args: [
          intId,
          newPersonId,
          data.college_name || null,
          data.course || null,
          data.specialization || null,
          data.domain || 'Software Engineering',
          data.internship_title || data.designation,
          data.project_name || null,
          data.internship_start_date || data.joining_date,
          data.internship_end_date || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
          data.internship_mode || 'Remote',
          data.stipend || null,
          now,
          now,
        ],
      });
    }

    await this.logActivity(actor, 'PERSON_CREATED', 'PERSON', newPersonId, { code: personCode, name: data.full_name, type: data.person_type });

    const created = await this.getPersonById(newPersonId);
    return created!;
  },

  async archivePerson(id: string, actor: { id?: string; name: string }): Promise<Person> {
    await ensureDb();
    const db = getTursoClient();
    const now = new Date().toISOString();

    await db.execute({
      sql: "UPDATE people SET status = 'ARCHIVED', archived_at = ?, updated_at = ? WHERE id = ?",
      args: [now, now, id],
    });

    await this.logActivity(actor, 'PERSON_ARCHIVED', 'PERSON', id, {});
    const updated = await this.getPersonById(id);
    return updated!;
  },

  // === INTERNSHIP LIFECYCLE ===
  async completeInternship(params: {
    internshipId: string;
    finalEndDate: string;
    completionNotes?: string | null;
    deactivateIdCard?: boolean;
    actor: { id?: string; name: string };
  }): Promise<Internship> {
    await ensureDb();
    const db = getTursoClient();
    const now = new Date().toISOString();

    const intRes = await db.execute({
      sql: 'SELECT * FROM internships WHERE id = ?',
      args: [params.internshipId],
    });
    if (intRes.rows.length === 0) throw new Error('Internship not found');
    const internship = intRes.rows[0];

    await db.execute({
      sql: "UPDATE internships SET status = 'COMPLETED', final_end_date = ?, completed_at = ?, completed_by = ?, completion_notes = ?, updated_at = ? WHERE id = ?",
      args: [params.finalEndDate, now, params.actor.id || null, params.completionNotes || null, now, params.internshipId],
    });

    await db.execute({
      sql: "UPDATE people SET status = 'COMPLETED', updated_at = ? WHERE id = ?",
      args: [now, String(internship.person_id)],
    });

    if (params.deactivateIdCard) {
      const activeCard = await db.execute({
        sql: "SELECT id FROM id_cards WHERE person_id = ? AND status = 'ACTIVE' LIMIT 1",
        args: [String(internship.person_id)],
      });
      if (activeCard.rows.length > 0) {
        await this.revokeIdCard(String(activeCard.rows[0].id), 'Internship completed', params.actor);
      }
    }

    await this.logActivity(params.actor, 'INTERNSHIP_COMPLETED', 'INTERNSHIP', params.internshipId, {
      person_id: String(internship.person_id),
      final_end_date: params.finalEndDate,
    });

    const updated = await db.execute({
      sql: 'SELECT * FROM internships WHERE id = ?',
      args: [params.internshipId],
    });
    const row = updated.rows[0];

    return {
      id: String(row.id),
      person_id: String(row.person_id),
      domain: String(row.domain),
      internship_title: String(row.internship_title),
      start_date: String(row.start_date),
      end_date: String(row.end_date),
      final_end_date: row.final_end_date ? String(row.final_end_date) : null,
      mode: row.mode as any,
      status: row.status as any,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  },

  // === ID CARDS ===
  async getIdCards(): Promise<IdCard[]> {
    await ensureDb();
    const db = getTursoClient();
    const res = await db.execute(`
      SELECT c.*, p.person_code, p.full_name, p.profile_photo_path, p.designation, p.person_type
      FROM id_cards c
      LEFT JOIN people p ON c.person_id = p.id
      ORDER BY c.created_at DESC
    `);

    return res.rows.map((row) => ({
      id: String(row.id),
      person_id: String(row.person_id),
      card_number: String(row.card_number),
      issued_at: String(row.issued_at),
      valid_from: String(row.valid_from),
      valid_until: String(row.valid_until),
      status: row.status as any,
      public_verification_code: String(row.public_verification_code),
      template_version: Number(row.template_version),
      created_at: String(row.created_at),
      person: {
        id: String(row.person_id),
        person_code: String(row.person_code),
        full_name: String(row.full_name),
        profile_photo_path: row.profile_photo_path ? String(row.profile_photo_path) : null,
        designation: String(row.designation),
        person_type: row.person_type as any,
        joining_date: '',
        status: 'ACTIVE',
        created_at: '',
        updated_at: '',
      },
    }));
  },

  async getIdCardById(id: string): Promise<IdCard | null> {
    await ensureDb();
    const db = getTursoClient();
    const res = await db.execute({
      sql: `SELECT c.*, p.person_code, p.full_name, p.profile_photo_path, p.designation, p.person_type, d.name as dept_name
            FROM id_cards c
            LEFT JOIN people p ON c.person_id = p.id
            LEFT JOIN departments d ON p.department_id = d.id
            WHERE c.id = ?`,
      args: [id],
    });

    if (res.rows.length === 0) return null;
    const row = res.rows[0];

    return {
      id: String(row.id),
      person_id: String(row.person_id),
      card_number: String(row.card_number),
      issued_at: String(row.issued_at),
      valid_from: String(row.valid_from),
      valid_until: String(row.valid_until),
      status: row.status as any,
      public_verification_code: String(row.public_verification_code),
      template_version: Number(row.template_version),
      created_at: String(row.created_at),
      person: {
        id: String(row.person_id),
        person_code: String(row.person_code),
        full_name: String(row.full_name),
        profile_photo_path: row.profile_photo_path ? String(row.profile_photo_path) : null,
        designation: String(row.designation),
        person_type: row.person_type as any,
        department: row.dept_name ? { id: '', name: String(row.dept_name), display_order: 0, is_active: true, created_at: '' } : null,
        joining_date: '',
        status: 'ACTIVE',
        created_at: '',
        updated_at: '',
      },
    };
  },

  async generateIdCard(personId: string, actor: { id?: string; name: string }): Promise<IdCard> {
    await ensureDb();
    const db = getTursoClient();
    const person = await this.getPersonById(personId);
    if (!person) throw new Error('Person not found');

    // Revoke any existing active ID cards
    const activeCards = await db.execute({
      sql: "SELECT id FROM id_cards WHERE person_id = ? AND status = 'ACTIVE'",
      args: [personId],
    });
    for (const card of activeCards.rows) {
      await this.revokeIdCard(String(card.id), 'Superceded by reissued ID card', actor);
    }

    const cardCountRes = await db.execute({
      sql: 'SELECT count(*) as count FROM id_cards WHERE person_id = ?',
      args: [personId],
    });
    const count = Number(cardCountRes.rows[0].count) + 1;
    const cardNumber = `IDC-${person.person_code}-v${count}`;

    const rawToken = generateVerificationToken('id_v_');
    const tokenHash = hashToken(rawToken);
    const tokenId = `tok-${Date.now()}`;
    const cardId = `idc-${Date.now()}`;
    const now = new Date().toISOString();

    const company = await this.getCompanySettings();
    const validUntilDate = new Date(Date.now() + company.id_default_validity_days * 86400000).toISOString().split('T')[0];

    await db.execute({
      sql: "INSERT INTO verification_tokens (id, token_hash, resource_type, resource_id, status, created_at) VALUES (?, ?, 'ID_CARD', ?, 'ACTIVE', ?)",
      args: [tokenId, tokenHash, cardId, now],
    });

    await db.execute({
      sql: `INSERT INTO id_cards (
        id, person_id, card_number, issued_at, valid_from, valid_until,
        status, verification_token_id, public_verification_code, template_version,
        issued_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, 1, ?, ?)`,
      args: [
        cardId,
        personId,
        cardNumber,
        now,
        new Date().toISOString().split('T')[0],
        validUntilDate,
        tokenId,
        rawToken,
        actor.id || null,
        now,
      ],
    });

    await this.logActivity(actor, count > 1 ? 'ID_REISSUED' : 'ID_ISSUED', 'ID_CARD', cardId, {
      card_number: cardNumber,
      person_code: person.person_code,
    });

    const card = await this.getIdCardById(cardId);
    return card!;
  },

  async revokeIdCard(cardId: string, reason: string, actor: { id?: string; name: string }): Promise<IdCard> {
    await ensureDb();
    const db = getTursoClient();
    const now = new Date().toISOString();

    const cardRes = await db.execute({
      sql: 'SELECT * FROM id_cards WHERE id = ?',
      args: [cardId],
    });
    if (cardRes.rows.length === 0) throw new Error('ID Card not found');
    const card = cardRes.rows[0];

    await db.execute({
      sql: "UPDATE id_cards SET status = 'REVOKED', revoked_at = ?, revoked_by = ?, revocation_reason = ? WHERE id = ?",
      args: [now, actor.id || null, reason, cardId],
    });

    if (card.verification_token_id) {
      await db.execute({
        sql: "UPDATE verification_tokens SET status = 'REVOKED', revoked_at = ? WHERE id = ?",
        args: [now, String(card.verification_token_id)],
      });
    }

    await this.logActivity(actor, 'ID_REVOKED', 'ID_CARD', cardId, { card_number: String(card.card_number), reason });

    const updated = await this.getIdCardById(cardId);
    return updated!;
  },

  // === CERTIFICATES ===
  async getCertificates(): Promise<Certificate[]> {
    await ensureDb();
    const db = getTursoClient();
    const res = await db.execute('SELECT * FROM certificates ORDER BY created_at DESC');

    return res.rows.map((cert) => ({
      id: String(cert.id),
      person_id: String(cert.person_id),
      internship_id: String(cert.internship_id),
      certificate_number: String(cert.certificate_number),
      certificate_type: String(cert.certificate_type),
      issue_date: String(cert.issue_date),
      status: cert.status as any,
      public_verification_code: String(cert.public_verification_code),
      recipient_name_snapshot: String(cert.recipient_name_snapshot),
      person_code_snapshot: String(cert.person_code_snapshot),
      role_snapshot: String(cert.role_snapshot),
      department_snapshot: String(cert.department_snapshot),
      domain_snapshot: cert.domain_snapshot ? String(cert.domain_snapshot) : null,
      project_snapshot: cert.project_snapshot ? String(cert.project_snapshot) : null,
      start_date_snapshot: String(cert.start_date_snapshot),
      end_date_snapshot: String(cert.end_date_snapshot),
      template_version: Number(cert.template_version),
      issued_at: String(cert.issued_at),
      created_at: String(cert.created_at),
      updated_at: String(cert.updated_at),
    }));
  },

  async getCertificateById(id: string): Promise<Certificate | null> {
    await ensureDb();
    const db = getTursoClient();
    const res = await db.execute({
      sql: 'SELECT * FROM certificates WHERE id = ?',
      args: [id],
    });
    if (res.rows.length === 0) return null;
    const cert = res.rows[0];

    return {
      id: String(cert.id),
      person_id: String(cert.person_id),
      internship_id: String(cert.internship_id),
      certificate_number: String(cert.certificate_number),
      certificate_type: String(cert.certificate_type),
      issue_date: String(cert.issue_date),
      status: cert.status as any,
      public_verification_code: String(cert.public_verification_code),
      recipient_name_snapshot: String(cert.recipient_name_snapshot),
      person_code_snapshot: String(cert.person_code_snapshot),
      role_snapshot: String(cert.role_snapshot),
      department_snapshot: String(cert.department_snapshot),
      domain_snapshot: cert.domain_snapshot ? String(cert.domain_snapshot) : null,
      project_snapshot: cert.project_snapshot ? String(cert.project_snapshot) : null,
      start_date_snapshot: String(cert.start_date_snapshot),
      end_date_snapshot: String(cert.end_date_snapshot),
      template_version: Number(cert.template_version),
      issued_at: String(cert.issued_at),
      created_at: String(cert.created_at),
      updated_at: String(cert.updated_at),
    };
  },

  async issueCertificate(params: {
    personId: string;
    internshipId: string;
    recipientName: string;
    role: string;
    department: string;
    domain?: string | null;
    project?: string | null;
    startDate: string;
    endDate: string;
    issueDate: string;
    signatoryName?: string | null;
    signatoryDesignation?: string | null;
    actor: { id?: string; name: string };
  }): Promise<Certificate> {
    await ensureDb();
    const db = getTursoClient();
    const person = await this.getPersonById(params.personId);
    if (!person) throw new Error('Person not found');

    const year = new Date(params.issueDate).getFullYear() || 2026;
    const seq = await this.getNextSequence('certificate');
    const certificateNumber = `GR/INT/${year}/${String(seq).padStart(4, '0')}`;

    const rawToken = generateVerificationToken('crt_v_');
    const tokenHash = hashToken(rawToken);
    const tokenId = `tok-cert-${Date.now()}`;
    const certId = `cert-${Date.now()}`;
    const now = new Date().toISOString();

    await db.execute({
      sql: "INSERT INTO verification_tokens (id, token_hash, resource_type, resource_id, status, created_at) VALUES (?, ?, 'CERTIFICATE', ?, 'ISSUED', ?)",
      args: [tokenId, tokenHash, certId, now],
    });

    await db.execute({
      sql: `INSERT INTO certificates (
        id, person_id, internship_id, certificate_number, certificate_type, issue_date,
        status, verification_token_id, public_verification_code,
        recipient_name_snapshot, person_code_snapshot, role_snapshot, department_snapshot,
        domain_snapshot, project_snapshot, start_date_snapshot, end_date_snapshot,
        duration_snapshot, supervisor_name_snapshot, signatory_name_snapshot, signatory_designation_snapshot,
        template_version, issued_by, issued_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'INTERNSHIP_COMPLETION', ?, 'ISSUED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
      args: [
        certId,
        params.personId,
        params.internshipId,
        certificateNumber,
        params.issueDate,
        tokenId,
        rawToken,
        params.recipientName,
        person.person_code,
        params.role,
        params.department,
        params.domain || null,
        params.project || null,
        params.startDate,
        params.endDate,
        `${params.startDate} – ${params.endDate}`,
        null,
        params.signatoryName || null,
        params.signatoryDesignation || null,
        params.actor.id || null,
        now,
        now,
        now,
      ],
    });

    await this.logActivity(params.actor, 'CERTIFICATE_ISSUED', 'CERTIFICATE', certId, {
      certificate_number: certificateNumber,
      recipient: params.recipientName,
    });

    const cert = await this.getCertificateById(certId);
    return cert!;
  },

  async revokeCertificate(certificateId: string, reason: string, actor: { id?: string; name: string }): Promise<Certificate> {
    await ensureDb();
    const db = getTursoClient();
    const now = new Date().toISOString();

    const certRes = await db.execute({
      sql: 'SELECT * FROM certificates WHERE id = ?',
      args: [certificateId],
    });
    if (certRes.rows.length === 0) throw new Error('Certificate not found');
    const cert = certRes.rows[0];

    await db.execute({
      sql: "UPDATE certificates SET status = 'REVOKED', revoked_at = ?, revoked_by = ?, revocation_reason = ?, updated_at = ? WHERE id = ?",
      args: [now, actor.id || null, reason, now, certificateId],
    });

    if (cert.verification_token_id) {
      await db.execute({
        sql: "UPDATE verification_tokens SET status = 'REVOKED', revoked_at = ? WHERE id = ?",
        args: [now, String(cert.verification_token_id)],
      });
    }

    await this.logActivity(actor, 'CERTIFICATE_REVOKED', 'CERTIFICATE', certificateId, {
      certificate_number: String(cert.certificate_number),
      reason,
    });

    const updated = await this.getCertificateById(certificateId);
    return updated!;
  },

  // === PUBLIC VERIFICATION ===
  async verifyIdByToken(rawToken: string): Promise<PublicIdVerificationResponse> {
    await ensureDb();
    const db = getTursoClient();
    const tokenHash = hashToken(rawToken);

    const tokRes = await db.execute({
      sql: "SELECT * FROM verification_tokens WHERE token_hash = ? AND resource_type = 'ID_CARD' LIMIT 1",
      args: [tokenHash],
    });

    if (tokRes.rows.length === 0) {
      return { success: false, status: 'NOT_FOUND', message: 'We could not find an official Go_Repireo record associated with this QR code.' };
    }
    const token = tokRes.rows[0];

    const cardRes = await db.execute({
      sql: `SELECT c.*, p.person_code, p.full_name, p.profile_photo_path, p.designation, p.person_type, d.name as dept_name
            FROM id_cards c
            LEFT JOIN people p ON c.person_id = p.id
            LEFT JOIN departments d ON p.department_id = d.id
            WHERE c.id = ?`,
      args: [String(token.resource_id)],
    });

    if (cardRes.rows.length === 0) {
      return { success: false, status: 'NOT_FOUND', message: 'ID record not found.' };
    }
    const card = cardRes.rows[0];
    const company = await this.getCompanySettings();

    return {
      success: true,
      status: card.status as any,
      card_number: String(card.card_number),
      issued_at: String(card.issued_at),
      valid_from: String(card.valid_from),
      valid_until: String(card.valid_until),
      revocation_reason: card.status === 'REVOKED' ? String(card.revocation_reason || '') : null,
      person: {
        code: String(card.person_code),
        name: String(card.full_name),
        type: card.person_type as any,
        designation: String(card.designation),
        department: String(card.dept_name || 'General'),
        photo_url: card.profile_photo_path ? String(card.profile_photo_path) : null,
      },
      company: {
        name: company.company_name,
        tagline: company.tagline,
        website: company.website,
        logo_url: company.logo_url || '/gorepireo-logo.png',
      },
    };
  },

  async verifyCertificateByToken(rawToken: string): Promise<PublicCertificateVerificationResponse> {
    await ensureDb();
    const db = getTursoClient();
    const tokenHash = hashToken(rawToken);

    const tokRes = await db.execute({
      sql: "SELECT * FROM verification_tokens WHERE token_hash = ? AND resource_type = 'CERTIFICATE' LIMIT 1",
      args: [tokenHash],
    });

    if (tokRes.rows.length === 0) {
      return { success: false, status: 'NOT_FOUND', message: 'We could not find an official Go_Repireo certificate associated with this QR code.' };
    }
    const token = tokRes.rows[0];

    const certRes = await db.execute({
      sql: 'SELECT * FROM certificates WHERE id = ?',
      args: [String(token.resource_id)],
    });

    if (certRes.rows.length === 0) {
      return { success: false, status: 'NOT_FOUND', message: 'Certificate record not found.' };
    }
    const cert = certRes.rows[0];
    const company = await this.getCompanySettings();

    return {
      success: true,
      status: cert.status as any,
      certificate_id: String(cert.id),
      certificate_number: String(cert.certificate_number),
      certificate_type: String(cert.certificate_type),
      issue_date: String(cert.issue_date),
      revocation_reason: cert.status === 'REVOKED' ? String(cert.revocation_reason || '') : null,
      snapshot: {
        name: String(cert.recipient_name_snapshot),
        person_code: String(cert.person_code_snapshot),
        role: String(cert.role_snapshot),
        department: String(cert.department_snapshot),
        domain: cert.domain_snapshot ? String(cert.domain_snapshot) : undefined,
        project: cert.project_snapshot ? String(cert.project_snapshot) : undefined,
        start_date: String(cert.start_date_snapshot),
        end_date: String(cert.end_date_snapshot),
        duration: cert.duration_snapshot ? String(cert.duration_snapshot) : undefined,
        signatory_name: cert.signatory_name_snapshot ? String(cert.signatory_name_snapshot) : undefined,
        signatory_designation: cert.signatory_designation_snapshot ? String(cert.signatory_designation_snapshot) : undefined,
      },
      pdf_storage_path: cert.pdf_storage_path ? String(cert.pdf_storage_path) : null,
      company: {
        name: company.company_name,
        tagline: company.tagline,
        website: company.website,
        logo_url: company.logo_url || '/gorepireo-logo.png',
      },
    };
  },

  // === DASHBOARD METRICS ===
  async getDashboardMetrics() {
    await ensureDb();
    const db = getTursoClient();

    const totalPeopleRes = await db.execute("SELECT count(*) as count FROM people WHERE status != 'ARCHIVED'");
    const activeEmpRes = await db.execute("SELECT count(*) as count FROM people WHERE person_type = 'EMPLOYEE' AND status = 'ACTIVE'");
    const activeIntRes = await db.execute("SELECT count(*) as count FROM people WHERE person_type = 'INTERN' AND status = 'ACTIVE'");
    const certIssuedRes = await db.execute("SELECT count(*) as count FROM certificates WHERE status = 'ISSUED'");

    const nowStr = new Date().toISOString().split('T')[0];
    const in30DaysStr = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const endingSoonRes = await db.execute({
      sql: `SELECT i.*, p.full_name as person_name, p.profile_photo_path, s.full_name as supervisor_name
            FROM internships i
            LEFT JOIN people p ON i.person_id = p.id
            LEFT JOIN people s ON i.supervisor_id = s.id
            WHERE i.status = 'ACTIVE' AND i.end_date >= ? AND i.end_date <= ?`,
      args: [nowStr, in30DaysStr],
    });

    const recentPeople = await this.getPeople();
    const recentCertificates = await this.getCertificates();

    return {
      metrics: {
        totalPeople: Number(totalPeopleRes.rows[0].count),
        activeEmployees: Number(activeEmpRes.rows[0].count),
        activeInterns: Number(activeIntRes.rows[0].count),
        certificatesIssued: Number(certIssuedRes.rows[0].count),
      },
      endingSoon: endingSoonRes.rows.map((r) => ({
        id: String(r.id),
        person_id: String(r.person_id),
        domain: String(r.domain),
        internship_title: String(r.internship_title),
        start_date: String(r.start_date),
        end_date: String(r.end_date),
        mode: r.mode as any,
        status: r.status as any,
        created_at: String(r.created_at),
        updated_at: String(r.updated_at),
        person: {
          id: String(r.person_id),
          full_name: String(r.person_name),
          profile_photo_path: r.profile_photo_path ? String(r.profile_photo_path) : null,
          person_code: '',
          person_type: 'INTERN' as any,
          designation: '',
          joining_date: '',
          status: 'ACTIVE' as any,
          created_at: '',
          updated_at: '',
        },
        supervisor: r.supervisor_name ? {
          id: '',
          full_name: String(r.supervisor_name),
          person_code: '',
          person_type: 'EMPLOYEE' as any,
          designation: '',
          joining_date: '',
          status: 'ACTIVE' as any,
          created_at: '',
          updated_at: '',
        } : null,
      })),
      recentPeople: recentPeople.slice(0, 5),
      recentCertificates: recentCertificates.slice(0, 5),
    };
  },

  // === ACTIVITY LOGGING ===
  async logActivity(
    actor: { id?: string; name: string },
    action: string,
    entityType: string,
    entityId: string,
    metadata: Record<string, unknown>
  ) {
    try {
      const db = getTursoClient();
      await db.execute({
        sql: 'INSERT INTO activity_logs (id, actor_id, actor_name, action, entity_type, entity_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          `act-${Date.now()}`,
          actor.id || null,
          actor.name,
          action,
          entityType,
          entityId,
          JSON.stringify(metadata),
          new Date().toISOString(),
        ],
      });
    } catch (e) {
      console.error('Failed to log activity', e);
    }
  },

  async getActivityLogsForEntity(entityType: string, entityId: string): Promise<ActivityLog[]> {
    await ensureDb();
    const db = getTursoClient();
    const res = await db.execute({
      sql: 'SELECT * FROM activity_logs WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC',
      args: [entityType, entityId],
    });

    return res.rows.map((row) => ({
      id: String(row.id),
      actor_id: row.actor_id ? String(row.actor_id) : null,
      actor_name: String(row.actor_name),
      action: String(row.action),
      entity_type: String(row.entity_type),
      entity_id: String(row.entity_id),
      metadata: JSON.parse(String(row.metadata || '{}')),
      created_at: String(row.created_at),
    }));
  },
};
