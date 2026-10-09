import { getTursoClient } from '../lib/turso';
import { initTursoSchema } from '../lib/tursoSchema';
import { generateVerificationToken, hashToken, generateCryptoAlphanumeric } from '../lib/tokens';
import QRCode from 'qrcode';
import { 
  Person, Internship, IdCard, Certificate, ActivityLog, 
  CompanySettings, Department, Profile, PublicIdVerificationResponse, 
  PublicCertificateVerificationResponse, PublicCardApiResponse,
  ApiKey, PromoteInternData
} from '../types';
import { PersonFormData } from '../validators';

let initialized = false;
async function ensureDb() {
  if (!initialized) {
    await initTursoSchema();
    try {
      const db = getTursoClient();
      const legacyPeople = await db.execute("SELECT id, person_code, person_type FROM people WHERE person_code LIKE 'GR-%'");
      for (const p of legacyPeople.rows) {
        const prefix = p.person_type === 'EMPLOYEE' ? 'GRE-' : 'GRI-';
        const newCode = `${prefix}${generateCryptoAlphanumeric(7)}`;
        await db.execute({
          sql: 'UPDATE people SET person_code = ? WHERE id = ?',
          args: [newCode, String(p.id)],
        });
        await db.execute({
          sql: 'UPDATE certificates SET person_code_snapshot = ? WHERE person_code_snapshot = ?',
          args: [newCode, String(p.person_code)],
        });
      }
      const legacyCards = await db.execute("SELECT id, card_number FROM id_cards WHERE card_number LIKE 'IDC-GR-%'");
      for (const c of legacyCards.rows) {
        const newCardNumber = `IDC-${generateCryptoAlphanumeric(7)}`;
        await db.execute({
          sql: 'UPDATE id_cards SET card_number = ? WHERE id = ?',
          args: [newCardNumber, String(c.id)],
        });
      }
    } catch (e) {
      console.warn('Auto-migration notice:', e);
    }
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

  async deleteDepartment(id: string): Promise<boolean> {
    await ensureDb();
    const db = getTursoClient();

    const checkRes = await db.execute({
      sql: 'SELECT id FROM departments WHERE id = ?',
      args: [id],
    });
    if (checkRes.rows.length === 0) {
      throw new Error('Department not found');
    }

    // Unlink any members assigned to this department
    await db.execute({
      sql: 'UPDATE people SET department_id = NULL WHERE department_id = ?',
      args: [id],
    });

    // Delete the department
    await db.execute({
      sql: 'DELETE FROM departments WHERE id = ?',
      args: [id],
    });

    return true;
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

  // === SEQUENCES & UNIQUE IDENTIFIERS ===
  async generateUniquePersonCode(personType: 'EMPLOYEE' | 'INTERN'): Promise<string> {
    await ensureDb();
    const db = getTursoClient();
    const prefix = personType === 'EMPLOYEE' ? 'GRE-' : 'GRI-';

    let attempts = 0;
    while (attempts < 1000) {
      const candidate = `${prefix}${generateCryptoAlphanumeric(7)}`;
      const res = await db.execute({
        sql: 'SELECT id FROM people WHERE person_code = ? LIMIT 1',
        args: [candidate],
      });
      if (res.rows.length === 0) {
        return candidate;
      }
      attempts++;
    }
    throw new Error('Failed to generate a unique Staff ID after multiple attempts');
  },

  async generateUniqueCardNumber(): Promise<string> {
    await ensureDb();
    const db = getTursoClient();

    let attempts = 0;
    while (attempts < 1000) {
      const candidate = `IDC-${generateCryptoAlphanumeric(7)}`;
      const res = await db.execute({
        sql: 'SELECT id FROM id_cards WHERE card_number = ? LIMIT 1',
        args: [candidate],
      });
      if (res.rows.length === 0) {
        return candidate;
      }
      attempts++;
    }
    throw new Error('Failed to generate a unique Card Reference after multiple attempts');
  },

  async generateUniqueCertificateNumber(issueDate: string): Promise<string> {
    await ensureDb();
    const db = getTursoClient();
    const year = new Date(issueDate).getFullYear() || 2026;
    const prefix = `GR/INT/${year}`;

    // Fetch all existing certificate numbers to guarantee zero collisions
    const existingRes = await db.execute({
      sql: 'SELECT certificate_number FROM certificates WHERE certificate_number LIKE ?',
      args: [`${prefix}/%`],
    });
    const existingNumbers = new Set(existingRes.rows.map(r => String(r.certificate_number)));

    // Generate random 4-digit code (1000 - 9999), retrying until unique
    let candidate = '';
    let attempts = 0;
    while (attempts < 10000) {
      const randNum = Math.floor(1000 + Math.random() * 9000); // 1000 to 9999
      candidate = `${prefix}/${randNum}`;
      if (!existingNumbers.has(candidate)) {
        return candidate;
      }
      attempts++;
    }

    // Fallback if 4-digit range becomes exhausted: use 5-digit random
    return `${prefix}/${Math.floor(10000 + Math.random() * 90000)}`;
  },

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

    const personCode = await this.generateUniquePersonCode(data.person_type);

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

  async updatePerson(id: string, data: Partial<PersonFormData>, actor: { id?: string; name: string }): Promise<Person> {
    await ensureDb();
    const db = getTursoClient();
    const existing = await this.getPersonById(id);
    if (!existing) throw new Error('Person not found');

    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE people SET
        full_name = COALESCE(?, full_name),
        display_name = ?,
        profile_photo_path = COALESCE(?, profile_photo_path),
        personal_email = ?,
        company_email = ?,
        phone = ?,
        date_of_birth = ?,
        gender = ?,
        address_line = ?,
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        postal_code = ?,
        country = COALESCE(?, country),
        department_id = ?,
        designation = COALESCE(?, designation),
        joining_date = COALESCE(?, joining_date),
        reporting_manager_id = ?,
        work_location = COALESCE(?, work_location),
        employment_type = ?,
        emergency_contact_name = ?,
        emergency_contact_phone = ?,
        internal_notes = ?,
        updated_at = ?
      WHERE id = ?`,
      args: [
        (data.full_name !== undefined ? data.full_name : existing.full_name) ?? null,
        (data.display_name !== undefined ? data.display_name : existing.display_name) ?? null,
        (data.profile_photo_path !== undefined ? data.profile_photo_path : existing.profile_photo_path) ?? null,
        (data.personal_email !== undefined ? data.personal_email : existing.personal_email) ?? null,
        (data.company_email !== undefined ? data.company_email : existing.company_email) ?? null,
        (data.phone !== undefined ? data.phone : existing.phone) ?? null,
        (data.date_of_birth ? data.date_of_birth : (data.date_of_birth === '' ? null : existing.date_of_birth)) ?? null,
        (data.gender !== undefined ? data.gender : existing.gender) ?? null,
        (data.address_line !== undefined ? data.address_line : existing.address_line) ?? null,
        (data.city !== undefined ? data.city : existing.city) ?? null,
        (data.state !== undefined ? data.state : existing.state) ?? null,
        (data.postal_code !== undefined ? data.postal_code : existing.postal_code) ?? null,
        (data.country !== undefined ? data.country : existing.country) ?? null,
        (data.department_id ? data.department_id : (data.department_id === '' ? null : existing.department_id)) ?? null,
        (data.designation !== undefined ? data.designation : existing.designation) ?? null,
        (data.joining_date !== undefined ? data.joining_date : existing.joining_date) ?? null,
        (data.reporting_manager_id ? data.reporting_manager_id : (data.reporting_manager_id === '' ? null : existing.reporting_manager_id)) ?? null,
        (data.work_location !== undefined ? data.work_location : existing.work_location) ?? null,
        (data.employment_type !== undefined ? data.employment_type : existing.employment_type) ?? null,
        (data.emergency_contact_name !== undefined ? data.emergency_contact_name : existing.emergency_contact_name) ?? null,
        (data.emergency_contact_phone !== undefined ? data.emergency_contact_phone : existing.emergency_contact_phone) ?? null,
        (data.internal_notes !== undefined ? data.internal_notes : existing.internal_notes) ?? null,
        now,
        id,
      ] as any,
    });

    // Update active internship details if this person has an internship
    if (existing.person_type === 'INTERN') {
      if (existing.internships && existing.internships.length > 0) {
        const activeInt = existing.internships[0];
        await db.execute({
          sql: `UPDATE internships SET
            college_name = ?,
            course = ?,
            specialization = ?,
            domain = COALESCE(?, domain),
            internship_title = COALESCE(?, internship_title),
            project_name = ?,
            start_date = COALESCE(?, start_date),
            end_date = COALESCE(?, end_date),
            mode = COALESCE(?, mode),
            stipend = ?,
            updated_at = ?
          WHERE id = ?`,
          args: [
            (data.college_name !== undefined ? data.college_name : activeInt.college_name) ?? null,
            (data.course !== undefined ? data.course : activeInt.course) ?? null,
            (data.specialization !== undefined ? data.specialization : activeInt.specialization) ?? null,
            (data.domain !== undefined ? data.domain : activeInt.domain) ?? null,
            (data.internship_title !== undefined ? data.internship_title : activeInt.internship_title) ?? null,
            (data.project_name !== undefined ? data.project_name : activeInt.project_name) ?? null,
            (data.internship_start_date !== undefined ? data.internship_start_date : activeInt.start_date) ?? null,
            (data.internship_end_date !== undefined ? data.internship_end_date : activeInt.end_date) ?? null,
            (data.internship_mode !== undefined ? data.internship_mode : activeInt.mode) ?? null,
            (data.stipend !== undefined ? data.stipend : activeInt.stipend) ?? null,
            now,
            activeInt.id,
          ] as any,
        });
      } else {
        const intId = `int-${Date.now()}`;
        await db.execute({
          sql: `INSERT INTO internships (
            id, person_id, college_name, course, specialization, domain,
            internship_title, project_name, start_date, end_date, mode, stipend,
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
          args: [
            intId,
            id,
            data.college_name || null,
            data.course || null,
            data.specialization || null,
            data.domain || 'Software Engineering',
            data.internship_title || data.designation || 'Intern',
            data.project_name || null,
            data.internship_start_date || existing.joining_date,
            data.internship_end_date || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
            data.internship_mode || 'Remote',
            data.stipend || null,
            now,
            now,
          ] as any,
        });
      }
    }

    await this.logActivity(actor, 'PERSON_UPDATED' as any, 'PERSON', id, {
      code: existing.person_code,
      name: data.full_name || existing.full_name,
    });

    const updated = await this.getPersonById(id);
    return updated!;
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
    internshipId?: string;
    internship_id?: string;
    finalEndDate?: string;
    final_end_date?: string;
    completionNotes?: string | null;
    completion_notes?: string | null;
    deactivateIdCard?: boolean;
    deactivate_id_card?: boolean;
    actor: { id?: string; name: string };
  }): Promise<Internship> {
    await ensureDb();
    const db = getTursoClient();
    const now = new Date().toISOString();

    const internshipId = params.internshipId || params.internship_id;
    if (!internshipId) throw new Error('Internship ID required');

    const finalEndDate = params.finalEndDate || params.final_end_date || new Date().toISOString().split('T')[0];
    const completionNotes = params.completionNotes || params.completion_notes || null;
    const deactivateIdCard = Boolean(params.deactivateIdCard ?? params.deactivate_id_card);

    const intRes = await db.execute({
      sql: 'SELECT * FROM internships WHERE id = ?',
      args: [internshipId],
    });
    if (intRes.rows.length === 0) throw new Error('Internship not found');
    const internship = intRes.rows[0];

    await db.execute({
      sql: "UPDATE internships SET status = 'COMPLETED', final_end_date = ?, completed_at = ?, completed_by = ?, completion_notes = ?, updated_at = ? WHERE id = ?",
      args: [finalEndDate, now, params.actor.id || null, completionNotes, now, internshipId],
    });

    await db.execute({
      sql: "UPDATE people SET status = 'COMPLETED', updated_at = ? WHERE id = ?",
      args: [now, String(internship.person_id)],
    });

    if (deactivateIdCard) {
      const activeCard = await db.execute({
        sql: "SELECT id FROM id_cards WHERE person_id = ? AND status = 'ACTIVE' LIMIT 1",
        args: [String(internship.person_id)],
      });
      if (activeCard.rows.length > 0) {
        await this.revokeIdCard(String(activeCard.rows[0].id), 'Internship completed', params.actor);
      }
    }

    await this.logActivity(params.actor, 'INTERNSHIP_COMPLETED', 'INTERNSHIP', internshipId, {
      person_id: String(internship.person_id),
      final_end_date: finalEndDate,
    });

    const updated = await db.execute({
      sql: 'SELECT * FROM internships WHERE id = ?',
      args: [internshipId],
    });
    const row = updated.rows[0];

    return {
      id: String(row.id),
      person_id: String(row.person_id),
      college_name: row.college_name ? String(row.college_name) : null,
      course: row.course ? String(row.course) : null,
      specialization: row.specialization ? String(row.specialization) : null,
      domain: String(row.domain),
      internship_title: String(row.internship_title),
      project_name: row.project_name ? String(row.project_name) : null,
      start_date: String(row.start_date),
      end_date: String(row.end_date),
      final_end_date: row.final_end_date ? String(row.final_end_date) : null,
      mode: row.mode as any,
      stipend: row.stipend ? String(row.stipend) : null,
      status: row.status as any,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  },

  async promoteInternToEmployee(
    personId: string,
    data: PromoteInternData,
    actor: { id?: string; name: string }
  ): Promise<{ person: Person; newCard?: IdCard | null }> {
    await ensureDb();
    const db = getTursoClient();
    const now = new Date().toISOString();

    const person = await this.getPersonById(personId);
    if (!person) throw new Error('Person not found');
    if (person.person_type !== 'INTERN') {
      throw new Error('Only interns can be promoted to employee');
    }

    // Determine new person_code: transform GRI-XXXXXXX to GRE-XXXXXXX preserving the exact suffix
    const currentCode = person.person_code;
    let newCode = currentCode;
    if (currentCode.startsWith('GRI-')) {
      newCode = 'GRE-' + currentCode.slice(4);
    } else if (!currentCode.startsWith('GRE-')) {
      newCode = 'GRE-' + currentCode;
    }

    // Verify uniqueness of newCode
    const checkRes = await db.execute({
      sql: 'SELECT id FROM people WHERE person_code = ? AND id != ? LIMIT 1',
      args: [newCode, personId],
    });
    if (checkRes.rows.length > 0) {
      throw new Error(`Employee ID ${newCode} already exists in the system`);
    }

    const newDesignation = data.designation?.trim() || person.designation;
    const newDepartmentId = data.department_id || person.department_id || null;
    const newWorkLocation = data.work_location?.trim() || person.work_location || 'Kolkata, WB';
    const newEmpType = data.employment_type || 'Full-time';

    // Update people record
    await db.execute({
      sql: `UPDATE people 
            SET person_type = 'EMPLOYEE',
                person_code = ?,
                status = 'ACTIVE',
                designation = ?,
                department_id = ?,
                work_location = ?,
                employment_type = ?,
                updated_at = ?,
                updated_by = ?
            WHERE id = ?`,
      args: [
        newCode,
        newDesignation,
        newDepartmentId,
        newWorkLocation,
        newEmpType,
        now,
        actor.id || null,
        personId,
      ],
    });

    let newCard: IdCard | null = null;
    const shouldReissue = data.reissue_id_card !== false;

    if (shouldReissue) {
      // Revoke any active card for this person
      const activeCards = await db.execute({
        sql: "SELECT id FROM id_cards WHERE person_id = ? AND status = 'ACTIVE'",
        args: [personId],
      });
      for (const cardRow of activeCards.rows) {
        await this.revokeIdCard(String(cardRow.id), 'Promoted to Employee (ID upgraded to GRE)', actor);
      }

      // Generate new active ID card with GRE
      newCard = await this.generateIdCard(personId, actor);
    }

    await this.logActivity(actor, 'PROMOTED_TO_EMPLOYEE', 'PERSON', personId, {
      from_code: currentCode,
      to_code: newCode,
      from_type: 'INTERN',
      to_type: 'EMPLOYEE',
      designation: newDesignation,
      reissued_card: shouldReissue,
    });

    const updatedPerson = await this.getPersonById(personId);
    return { person: updatedPerson!, newCard };
  },

  // === ID CARDS ===
  async getIdCards(): Promise<IdCard[]> {
    await ensureDb();
    const db = getTursoClient();
    const res = await db.execute(`
      SELECT c.*, p.person_code, p.full_name, p.profile_photo_path, p.designation, p.person_type, d.name as dept_name
      FROM id_cards c
      LEFT JOIN people p ON c.person_id = p.id
      LEFT JOIN departments d ON p.department_id = d.id
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
        department: row.dept_name ? { id: '', name: String(row.dept_name), display_order: 0, is_active: true, created_at: '' } : null,
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

  async generateIdCard(
    personId: string, 
    actor: { id?: string; name: string },
    customDates?: { valid_from?: string; valid_until?: string }
  ): Promise<IdCard> {
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

    const previousCardsRes = await db.execute({
      sql: 'SELECT count(*) as count FROM id_cards WHERE person_id = ?',
      args: [personId],
    });
    const isReissue = Number(previousCardsRes.rows[0].count) > 0;
    const cardNumber = await this.generateUniqueCardNumber();

    const rawToken = generateVerificationToken('id_v_');
    const tokenHash = hashToken(rawToken);
    const tokenId = `tok-${Date.now()}`;
    const cardId = `idc-${Date.now()}`;
    const now = new Date().toISOString();

    const issueDate = customDates?.valid_from?.trim() || new Date().toISOString().split('T')[0];
    let validUntilDate = customDates?.valid_until?.trim();
    if (!validUntilDate) {
      const d = new Date(issueDate);
      d.setFullYear(d.getFullYear() + 1);
      validUntilDate = d.toISOString().split('T')[0];
    }

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
        issueDate,
        validUntilDate,
        tokenId,
        rawToken,
        actor.id || null,
        now,
      ],
    });

    await this.logActivity(actor, isReissue ? 'ID_REISSUED' : 'ID_ISSUED', 'ID_CARD', cardId, {
      card_number: cardNumber,
      person_code: person.person_code,
      valid_from: issueDate,
      valid_until: validUntilDate,
    });

    const card = await this.getIdCardById(cardId);
    return card!;
  },

  async updateIdCardDates(
    cardId: string,
    validFrom: string,
    validUntil: string,
    actor: { id?: string; name: string }
  ): Promise<IdCard> {
    await ensureDb();
    const db = getTursoClient();
    const card = await this.getIdCardById(cardId);
    if (!card) throw new Error('ID Card not found');

    await db.execute({
      sql: 'UPDATE id_cards SET valid_from = ?, valid_until = ? WHERE id = ?',
      args: [validFrom.trim(), validUntil.trim(), cardId],
    });

    await this.logActivity(actor, 'ID_DATES_UPDATED', 'ID_CARD', cardId, {
      card_number: card.card_number,
      old_valid_from: card.valid_from,
      new_valid_from: validFrom.trim(),
      old_valid_until: card.valid_until,
      new_valid_until: validUntil.trim(),
    });

    const updated = await this.getIdCardById(cardId);
    return updated!;
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

    const certificateNumber = await this.generateUniqueCertificateNumber(params.issueDate);

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

  async deleteCertificate(certificateId: string, actor: { id?: string; name: string }): Promise<{ success: boolean; certificateNumber: string }> {
    await ensureDb();
    const db = getTursoClient();

    const certRes = await db.execute({
      sql: 'SELECT * FROM certificates WHERE id = ?',
      args: [certificateId],
    });
    if (certRes.rows.length === 0) throw new Error('Certificate not found');
    const cert = certRes.rows[0];
    const certNumber = String(cert.certificate_number);

    // Delete verification token if exists
    if (cert.verification_token_id) {
      await db.execute({
        sql: 'DELETE FROM verification_tokens WHERE id = ?',
        args: [String(cert.verification_token_id)],
      });
    }

    // Delete the certificate record
    await db.execute({
      sql: 'DELETE FROM certificates WHERE id = ?',
      args: [certificateId],
    });

    await this.logActivity(actor, 'CERTIFICATE_DELETED' as any, 'CERTIFICATE', certificateId, {
      certificate_number: certNumber,
      recipient: String(cert.recipient_name_snapshot),
    });

    return { success: true, certificateNumber: certNumber };
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

  // === PUBLIC CARD API FOR EXTERNAL WEBSITES ===
  async getPublicCardByIdentifier(identifier: string, origin?: string): Promise<PublicCardApiResponse> {
    await ensureDb();
    const db = getTursoClient();
    const cleanId = identifier.trim();
    const company = await this.getCompanySettings();
    const appBaseUrl = origin || 'https://go-repireo-employee-management.vercel.app';

    // 1. Try finding by ID card directly or by person
    const cardRes = await db.execute({
      sql: `SELECT c.*, 
                   p.id as person_id, p.person_code, p.full_name, p.profile_photo_path,
                   p.designation, p.person_type, p.status as person_status,
                   p.company_email, p.personal_email, p.work_location,
                   d.name as dept_name
            FROM id_cards c
            JOIN people p ON c.person_id = p.id
            LEFT JOIN departments d ON p.department_id = d.id
            WHERE UPPER(p.person_code) = UPPER(?)
               OR (p.person_code LIKE 'GRE-%' AND UPPER(REPLACE(p.person_code, 'GRE-', 'GRI-')) = UPPER(?))
               OR (p.person_code LIKE 'GRI-%' AND UPPER(REPLACE(p.person_code, 'GRI-', 'GRE-')) = UPPER(?))
               OR UPPER(c.card_number) = UPPER(?)
               OR c.public_verification_code = ?
               OR c.id = ?
               OR p.id = ?
               OR LOWER(p.company_email) = LOWER(?)
               OR LOWER(p.personal_email) = LOWER(?)
            ORDER BY (CASE WHEN c.status = 'ACTIVE' THEN 0 ELSE 1 END), c.issued_at DESC
            LIMIT 1`,
      args: [cleanId, cleanId, cleanId, cleanId, cleanId, cleanId, cleanId, cleanId, cleanId],
    });

    if (cardRes.rows.length > 0) {
      const row = cardRes.rows[0];
      const verifyUrl = `${appBaseUrl}/verify/id/${row.public_verification_code}`;

      let qrDataUrl = '';
      try {
        qrDataUrl = await QRCode.toDataURL(verifyUrl, {
          width: 320,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
      } catch (err) {
        console.error('Failed to generate QR data URL:', err);
      }

      return {
        success: true,
        found: true,
        card: {
          id: String(row.id),
          card_number: String(row.card_number),
          status: row.status as any,
          issued_at: String(row.issued_at),
          valid_from: String(row.valid_from),
          valid_until: String(row.valid_until),
          public_verification_code: String(row.public_verification_code),
          verification_url: verifyUrl,
          qr_code_data_url: qrDataUrl,
        },
        person: {
          id: String(row.person_id),
          person_code: String(row.person_code),
          full_name: String(row.full_name),
          person_type: row.person_type as any,
          designation: String(row.designation),
          department: String(row.dept_name || 'Technology'),
          status: row.person_status as any,
          avatar_url: row.profile_photo_path ? String(row.profile_photo_path) : null,
          company_email: row.company_email ? String(row.company_email) : null,
          work_location: row.work_location ? String(row.work_location) : null,
        },
        company: {
          name: company.company_name,
          legal_name: company.legal_name,
          tagline: company.tagline,
          website: company.website,
          support_email: company.support_email,
          logo_url: company.logo_url || '/gorepireo-logo.png',
          mascot_url: '/gorepireo-mascot-modified.png',
        },
        design: {
          theme: 'navy-orange',
          primary_color: '#0f274a',
          accent_color: '#1e40af',
          badge_color: '#ea580c',
          card_dimensions: {
            width_px: 280,
            height_px: 445,
            aspect_ratio: '1 : 1.589',
          },
        },
      };
    }

    // 2. Fallback: check if person exists even if no card was issued yet
    const personRes = await db.execute({
      sql: `SELECT p.*, d.name as dept_name
            FROM people p
            LEFT JOIN departments d ON p.department_id = d.id
            WHERE UPPER(p.person_code) = UPPER(?)
               OR (p.person_code LIKE 'GRE-%' AND UPPER(REPLACE(p.person_code, 'GRE-', 'GRI-')) = UPPER(?))
               OR (p.person_code LIKE 'GRI-%' AND UPPER(REPLACE(p.person_code, 'GRI-', 'GRE-')) = UPPER(?))
               OR LOWER(p.company_email) = LOWER(?)
               OR p.id = ?
            LIMIT 1`,
      args: [cleanId, cleanId, cleanId, cleanId, cleanId],
    });

    if (personRes.rows.length > 0) {
      const pRow = personRes.rows[0];
      return {
        success: true,
        found: true,
        message: 'Person found, but no ID card has been issued yet.',
        card: null,
        person: {
          id: String(pRow.id),
          person_code: String(pRow.person_code),
          full_name: String(pRow.full_name),
          person_type: pRow.person_type as any,
          designation: String(pRow.designation),
          department: String(pRow.dept_name || 'Technology'),
          status: pRow.status as any,
          avatar_url: pRow.profile_photo_path ? String(pRow.profile_photo_path) : null,
          company_email: pRow.company_email ? String(pRow.company_email) : null,
          work_location: pRow.work_location ? String(pRow.work_location) : null,
        },
        company: {
          name: company.company_name,
          legal_name: company.legal_name,
          tagline: company.tagline,
          website: company.website,
          support_email: company.support_email,
          logo_url: company.logo_url || '/gorepireo-logo.png',
          mascot_url: '/gorepireo-mascot-modified.png',
        },
        design: {
          theme: 'navy-orange',
          primary_color: '#0f274a',
          accent_color: '#1e40af',
          badge_color: '#ea580c',
          card_dimensions: {
            width_px: 280,
            height_px: 445,
            aspect_ratio: '1 : 1.589',
          },
        },
      };
    }

    return {
      success: false,
      found: false,
      message: `No personnel or ID card found matching identifier: ${identifier}`,
    };
  },

  async getPublicCardQrBuffer(identifier: string, origin?: string): Promise<Buffer | null> {
    const data = await this.getPublicCardByIdentifier(identifier, origin);
    if (!data.found || !data.card?.verification_url) {
      return null;
    }
    return QRCode.toBuffer(data.card.verification_url, {
      type: 'png',
      width: 400,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  },

  // === API KEYS MANAGEMENT ===
  async getApiKeys(): Promise<ApiKey[]> {
    await ensureDb();
    const db = getTursoClient();
    const res = await db.execute('SELECT * FROM api_keys ORDER BY created_at DESC');
    return res.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      key_prefix: String(row.key_prefix),
      status: row.status as any,
      created_at: String(row.created_at),
      created_by: row.created_by ? String(row.created_by) : null,
      last_used_at: row.last_used_at ? String(row.last_used_at) : null,
    }));
  },

  async createApiKey(name: string, actor: { id?: string; name: string }): Promise<ApiKey & { key_token: string }> {
    await ensureDb();
    const db = getTursoClient();
    const id = `apk-${Date.now()}`;
    const rawSecret = generateCryptoAlphanumeric(32);
    const fullToken = `grp_live_${rawSecret}`;
    const keyPrefix = `grp_live_${rawSecret.slice(0, 6)}...`;
    const now = new Date().toISOString();

    await db.execute({
      sql: 'INSERT INTO api_keys (id, name, key_prefix, key_token, status, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [id, name.trim(), keyPrefix, fullToken, 'ACTIVE', now, actor.id || actor.name],
    });

    await this.logActivity(actor, 'API_KEY_CREATED', 'API_KEY', id, { name: name.trim(), key_prefix: keyPrefix });

    return {
      id,
      name: name.trim(),
      key_prefix: keyPrefix,
      key_token: fullToken,
      status: 'ACTIVE',
      created_at: now,
      created_by: actor.name,
    };
  },

  async deleteApiKey(id: string, actor: { id?: string; name: string }): Promise<boolean> {
    await ensureDb();
    const db = getTursoClient();
    const keyRes = await db.execute({
      sql: 'SELECT * FROM api_keys WHERE id = ?',
      args: [id],
    });
    if (keyRes.rows.length === 0) return false;

    const row = keyRes.rows[0];
    await db.execute({
      sql: 'DELETE FROM api_keys WHERE id = ?',
      args: [id],
    });

    await this.logActivity(actor, 'API_KEY_DELETED', 'API_KEY', id, { name: String(row.name), key_prefix: String(row.key_prefix) });
    return true;
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

  // === FACE RECOGNITION AUTHENTICATION ===
  async getEnrolledFaceAccounts(): Promise<Array<{ id: string; email: string; full_name: string; role: string; descriptor: number[]; thumbnail_url?: string | null; updated_at: string }>> {
    await ensureDb();
    const db = getTursoClient();
    try {
      const res = await db.execute('SELECT * FROM user_face_credentials ORDER BY updated_at DESC');
      return res.rows.map((row) => {
        let descriptor: number[] = [];
        try {
          descriptor = JSON.parse(String(row.face_descriptor));
        } catch {
          descriptor = [];
        }
        return {
          id: String(row.id),
          email: String(row.user_email),
          full_name: String(row.full_name),
          role: String(row.role || 'VIEWER'),
          descriptor,
          thumbnail_url: row.thumbnail_url ? String(row.thumbnail_url) : null,
          updated_at: String(row.updated_at),
        };
      });
    } catch (e) {
      console.warn('Error reading user_face_credentials:', e);
      return [];
    }
  },

  async enrollFaceCredential(data: {
    email: string;
    full_name: string;
    role?: string;
    descriptor: number[];
    thumbnail_url?: string | null;
  }): Promise<{ success: boolean; id: string }> {
    await ensureDb();
    const db = getTursoClient();
    const id = `face-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const normalizedEmail = data.email.trim().toLowerCase();
    const role = data.role || (normalizedEmail === 'owner@gorepireo.in' ? 'OWNER' : normalizedEmail === 'samyaksingh1845@gmail.com' ? 'ADMIN' : 'VIEWER');
    const descriptorJson = JSON.stringify(data.descriptor);

    await db.execute({
      sql: `INSERT INTO user_face_credentials (id, user_email, full_name, role, face_descriptor, thumbnail_url, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            ON CONFLICT(user_email) DO UPDATE SET 
              full_name = excluded.full_name,
              role = excluded.role,
              face_descriptor = excluded.face_descriptor,
              thumbnail_url = coalesce(excluded.thumbnail_url, user_face_credentials.thumbnail_url),
              updated_at = datetime('now');`,
      args: [id, normalizedEmail, data.full_name, role, descriptorJson, data.thumbnail_url || null],
    });

    return { success: true, id };
  },

  async deleteFaceCredential(email: string): Promise<boolean> {
    await ensureDb();
    const db = getTursoClient();
    const normalizedEmail = email.trim().toLowerCase();
    await db.execute({
      sql: 'DELETE FROM user_face_credentials WHERE lower(user_email) = lower(?)',
      args: [normalizedEmail],
    });
    return true;
  },

  async verifyFaceLogin(candidateDescriptor: number[], preferredEmail?: string): Promise<{
    matched: boolean;
    user?: { email: string; full_name: string; role: string };
    distance?: number;
    similarityPercent?: number;
    error?: string;
  }> {
    const enrolled = await this.getEnrolledFaceAccounts();
    if (enrolled.length === 0) {
      return { matched: false, error: 'No face accounts are currently enrolled in the system.' };
    }

    if (!candidateDescriptor || candidateDescriptor.length !== 128) {
      return { matched: false, error: 'Invalid candidate facial descriptor (expected 128 dimensions).' };
    }

    // Filter by preferred email if specified, otherwise search all enrolled faces
    const candidates = preferredEmail 
      ? enrolled.filter((acc) => acc.email.toLowerCase() === preferredEmail.trim().toLowerCase())
      : enrolled;

    if (candidates.length === 0) {
      return { matched: false, error: `No face account found for ${preferredEmail}.` };
    }

    let bestAccount = candidates[0];
    let minDistance = 999.0;

    for (const acc of candidates) {
      if (!acc.descriptor || acc.descriptor.length !== 128) continue;
      let sum = 0;
      for (let i = 0; i < 128; i++) {
        const diff = candidateDescriptor[i] - acc.descriptor[i];
        sum += diff * diff;
      }
      const distance = Math.sqrt(sum);
      if (distance < minDistance) {
        minDistance = distance;
        bestAccount = acc;
      }
    }

    // Standard face-api Euclidean distance threshold:
    // Distance <= 0.52 indicates a confident match while eliminating false positives
    const MATCH_THRESHOLD = 0.52;
    const similarityPercent = Math.max(0, Math.min(100, Math.round((1 - minDistance * 0.9) * 100)));

    if (minDistance <= MATCH_THRESHOLD) {
      return {
        matched: true,
        user: {
          email: bestAccount.email,
          full_name: bestAccount.full_name,
          role: bestAccount.role,
        },
        distance: minDistance,
        similarityPercent,
      };
    }

    return {
      matched: false,
      distance: minDistance,
      similarityPercent,
      error: `Face did not match any enrolled account (Closest match: ${similarityPercent}%, required > 75%).`,
    };
  },
};
