import { getTursoClient } from './turso';

export async function initTursoSchema() {
  const db = getTursoClient();

  await db.batch([
    `CREATE TABLE IF NOT EXISTS company_settings (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      legal_name TEXT,
      tagline TEXT NOT NULL,
      logo_url TEXT,
      website TEXT,
      support_email TEXT,
      support_phone TEXT,
      address TEXT,
      id_default_validity_days INTEGER NOT NULL DEFAULT 365,
      signatory_name TEXT,
      signatory_designation TEXT,
      signature_url TEXT,
      stamp_url TEXT,
      certificate_heading TEXT,
      certificate_body_template TEXT,
      updated_at TEXT,
      updated_by TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'VIEWER',
      is_active INTEGER NOT NULL DEFAULT 1,
      avatar_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY,
      person_code TEXT UNIQUE NOT NULL,
      person_type TEXT NOT NULL,
      full_name TEXT NOT NULL,
      display_name TEXT,
      profile_photo_path TEXT,
      personal_email TEXT,
      company_email TEXT,
      phone TEXT,
      date_of_birth TEXT,
      gender TEXT,
      address_line TEXT,
      city TEXT,
      state TEXT,
      postal_code TEXT,
      country TEXT DEFAULT 'India',
      department_id TEXT,
      designation TEXT NOT NULL,
      joining_date TEXT NOT NULL,
      reporting_manager_id TEXT,
      work_location TEXT,
      employment_type TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      internal_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT,
      created_by TEXT,
      updated_by TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS internships (
      id TEXT PRIMARY KEY,
      person_id TEXT NOT NULL,
      college_name TEXT,
      course TEXT,
      specialization TEXT,
      domain TEXT NOT NULL,
      internship_title TEXT NOT NULL,
      project_name TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      final_end_date TEXT,
      mode TEXT NOT NULL DEFAULT 'Remote',
      stipend TEXT,
      supervisor_id TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      completed_at TEXT,
      completed_by TEXT,
      completion_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS id_cards (
      id TEXT PRIMARY KEY,
      person_id TEXT NOT NULL,
      card_number TEXT UNIQUE NOT NULL,
      issued_at TEXT NOT NULL,
      valid_from TEXT NOT NULL,
      valid_until TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      verification_token_id TEXT,
      public_verification_code TEXT NOT NULL,
      template_version INTEGER NOT NULL DEFAULT 1,
      issued_by TEXT,
      revoked_at TEXT,
      revoked_by TEXT,
      revocation_reason TEXT,
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      person_id TEXT NOT NULL,
      internship_id TEXT NOT NULL,
      certificate_number TEXT UNIQUE NOT NULL,
      certificate_type TEXT NOT NULL DEFAULT 'INTERNSHIP_COMPLETION',
      issue_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ISSUED',
      verification_token_id TEXT,
      public_verification_code TEXT NOT NULL,
      recipient_name_snapshot TEXT NOT NULL,
      person_code_snapshot TEXT NOT NULL,
      role_snapshot TEXT NOT NULL,
      department_snapshot TEXT NOT NULL,
      domain_snapshot TEXT,
      project_snapshot TEXT,
      start_date_snapshot TEXT NOT NULL,
      end_date_snapshot TEXT NOT NULL,
      duration_snapshot TEXT,
      supervisor_name_snapshot TEXT,
      signatory_name_snapshot TEXT,
      signatory_designation_snapshot TEXT,
      template_version INTEGER NOT NULL DEFAULT 1,
      pdf_storage_path TEXT,
      issued_by TEXT,
      issued_at TEXT NOT NULL,
      revoked_at TEXT,
      revoked_by TEXT,
      revocation_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS verification_tokens (
      id TEXT PRIMARY KEY,
      token_hash TEXT UNIQUE NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      revoked_at TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      actor_name TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS app_sequences (
      name TEXT PRIMARY KEY,
      current_value INTEGER NOT NULL DEFAULT 0
    );`
  ]);

  // Seed default sequence and initial company config if missing
  await db.execute({
    sql: `INSERT OR IGNORE INTO app_sequences (name, current_value) VALUES 
      ('employee', 0),
      ('intern', 0),
      ('certificate', 0);`,
    args: []
  });

  await db.execute({
    sql: `INSERT OR IGNORE INTO company_settings (
      id, company_name, legal_name, tagline, logo_url, website, support_email, support_phone, address,
      id_default_validity_days, signatory_name, signatory_designation, certificate_heading, certificate_body_template
    ) VALUES (
      'default-company-settings',
      'Go_Repireo',
      'Go_Repireo Technologies Pvt. Ltd.',
      'Learn • Build • Grow',
      '/gorepireo-logo.png',
      'https://gorepireo.in',
      'contact@gorepireo.in',
      '+91 98765 43210',
      'Kolkata, West Bengal, India',
      365,
      'Authorized Representative',
      'Director / Founder',
      'CERTIFICATE OF INTERNSHIP',
      'This is to certify that {{NAME}} has successfully completed an internship as {{ROLE}} with Go_Repireo from {{START_DATE}} to {{END_DATE}}. During the internship, the candidate contributed to {{PROJECT}}. We appreciate their dedication and wish them success in their future endeavors.'
    );`,
    args: []
  });

  // Seed essential company departments
  await db.execute({
    sql: `INSERT OR IGNORE INTO departments (id, name, display_order, is_active, created_at) VALUES 
      ('dept-tech', 'Technology', 1, 1, datetime('now')),
      ('dept-ops', 'Operations', 2, 1, datetime('now')),
      ('dept-des', 'Design', 3, 1, datetime('now')),
      ('dept-mkt', 'Marketing', 4, 1, datetime('now')),
      ('dept-bd', 'Business Development', 5, 1, datetime('now')),
      ('dept-fin', 'Finance', 6, 1, datetime('now')),
      ('dept-mgmt', 'Management', 7, 1, datetime('now')),
      ('dept-oth', 'Other', 8, 1, datetime('now'));`,
    args: []
  });
}
