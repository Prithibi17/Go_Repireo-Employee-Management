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
    );`,

    `CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      key_token TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      created_by TEXT,
      last_used_at TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS user_face_credentials (
      id TEXT PRIMARY KEY,
      user_email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'VIEWER',
      face_descriptor TEXT NOT NULL,
      thumbnail_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,

    `CREATE UNIQUE INDEX IF NOT EXISTS idx_people_person_code ON people (person_code);`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_id_cards_card_number ON id_cards (card_number);`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_cert_number ON certificates (certificate_number);`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_face_credentials_email ON user_face_credentials (user_email);`
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

  // Seed essential company departments only once during initial setup
  const seedCheck = await db.execute("SELECT current_value FROM app_sequences WHERE name = 'departments_seeded'");
  if (seedCheck.rows.length === 0) {
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
    await db.execute("INSERT OR REPLACE INTO app_sequences (name, current_value) VALUES ('departments_seeded', 1)");
  }

  // Ensure Admin profile for Samyak Singh
  try {
    await db.execute({
      sql: `INSERT INTO profiles (id, email, full_name, role, is_active, created_at, updated_at) VALUES 
        ('admin-profile-samyak', 'samyaksingh1845@gmail.com', 'Samyak Singh', 'ADMIN', 1, datetime('now'), datetime('now'))
        ON CONFLICT(email) DO UPDATE SET role = 'ADMIN', full_name = 'Samyak Singh', updated_at = datetime('now');`,
      args: []
    });
  } catch (err) {
    console.warn('Could not seed Samyak Singh profile:', err);
  }

  // Pre-seed trained Face Biometric credential for Owner (Prithibi Mandi)
  try {
    const OWNER_DESCRIPTOR = '[-0.19448451697826385,0.09915207326412201,0.07691874355077744,0.05141860619187355,0.01332646980881691,-0.049808159470558167,-0.060547053813934326,-0.12171543389558792,0.10147202759981155,-0.08566118776798248,0.2898637652397156,-0.05552174150943756,-0.1629665493965149,-0.2007317990064621,0.023522162809967995,0.17456205189228058,-0.20453089475631714,-0.12336268275976181,-0.10955199599266052,-0.09542462974786758,-0.05823599919676781,-0.05872507765889168,0.0827554240822792,0.07996318489313126,-0.06339500099420547,-0.3703363835811615,-0.10555388778448105,-0.14744973182678223,0.06900617480278015,-0.07656745612621307,0.008601748384535313,0.05356799066066742,-0.17048072814941406,-0.027231816202402115,-0.016576852649450302,0.08614110201597214,0.022969575598835945,0.032938435673713684,0.23966719210147858,-0.08210818469524384,-0.07880672067403793,-0.06940259039402008,0.06011054664850235,0.2763820290565491,0.20442821085453033,0.08976919949054718,-0.01113011036068201,0.060062382370233536,0.08507028222084045,-0.20084670186042786,-0.0041790921241045,0.10812346637248993,0.1504046767950058,0.08013936132192612,0.06634987890720367,-0.1319166123867035,0.020635142922401428,0.055741459131240845,-0.12665311992168427,0.040294066071510315,-0.058814167976379395,-0.14508944749832153,-0.06351529061794281,0.04776819422841072,0.32984527945518494,0.13206294178962708,-0.08673620223999023,-0.12385549396276474,0.18302153050899506,-0.12804293632507324,0.011600177735090256,0.09695717692375183,-0.1166410744190216,-0.13879342377185822,-0.28556033968925476,0.042349692434072495,0.41345465183258057,0.08417343348264694,-0.2141089141368866,0.029953358694911003,-0.052763860672712326,-0.03372449427843094,0.07744819670915604,0.057679593563079834,-0.12592369318008423,-0.011618386954069138,-0.13779936730861664,-0.01812727004289627,0.15039443969726562,-0.0038798563182353973,-0.05208485573530197,0.16644735634326935,-0.012028048746287823,0.05470055714249611,0.05682533606886864,-0.06002258509397507,0.030555488541722298,-0.020940221846103668,-0.1329001933336258,-0.006214627996087074,0.05624817684292793,-0.03296287730336189,0.0065581961534917355,-0.028064772486686707,-0.10172069072723389,0.04723561927676201,0.04455779120326042,0.02405388467013836,-0.02407953143119812,0.10972969233989716,-0.16396315395832062,-0.06544036418199539,0.16121657192707062,-0.2967458963394165,0.2146686613559723,0.18686151504516602,-0.03547424077987671,0.16985361278057098,0.07384924590587616,0.14837335050106049,-0.025695500895380974,0.004731373395770788,-0.025808855891227722,-0.06806954741477966,0.08703315258026123,-0.015101414173841476,0.08012495189905167,0.030196167528629303]';
    await db.execute({
      sql: `INSERT INTO user_face_credentials (id, user_email, full_name, role, face_descriptor, thumbnail_url, created_at, updated_at) VALUES 
        ('face-owner-prithibi', 'owner@gorepireo.in', 'Prithibi Mandi', 'OWNER', ?, '/faces/owner-2.png', datetime('now'), datetime('now'))
        ON CONFLICT(user_email) DO UPDATE SET 
          full_name = 'Prithibi Mandi',
          role = 'OWNER',
          face_descriptor = excluded.face_descriptor,
          thumbnail_url = '/faces/owner-2.png',
          updated_at = datetime('now');`,
      args: [OWNER_DESCRIPTOR]
    });
  } catch (err) {
    console.warn('Could not seed owner face credential:', err);
  }
}
