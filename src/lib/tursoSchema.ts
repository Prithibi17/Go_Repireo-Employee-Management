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
    const OWNER_DESCRIPTOR = '[-0.16395892202854156,0.09117715805768967,0.11492032557725906,0.03347351402044296,-0.030363623052835464,-0.06896571069955826,-0.02736346237361431,-0.11959865689277649,0.054893169552087784,-0.04884016513824463,0.2630198895931244,-0.05125940963625908,-0.18896743655204773,-0.15912584960460663,0.03945703059434891,0.15404893457889557,-0.21804837882518768,-0.11373536288738251,-0.1118142381310463,-0.11050450801849365,-0.0801917240023613,-0.038506101816892624,0.07013699412345886,0.08956583589315414,-0.04198463633656502,-0.33908572793006897,-0.10724897682666779,-0.12795500457286835,0.060237620025873184,-0.055777229368686676,0.011861123144626617,0.05847062170505524,-0.17481140792369843,-0.031888432800769806,-0.020119521766901016,0.07452396303415298,0.02925233729183674,0.002325263572856784,0.25102195143699646,-0.06250281631946564,-0.08150316774845123,-0.08184417337179184,0.06339509785175323,0.29192882776260376,0.2061060220003128,0.05889959633350372,-0.013318258337676525,0.10404142737388611,0.061429712921381,-0.238827183842659,-0.0019561632070690393,0.1315447837114334,0.12768742442131042,0.059681717306375504,0.05215461179614067,-0.15070964395999908,-0.003140017855912447,0.07221710681915283,-0.12718430161476135,0.05190125107765198,-0.0335916168987751,-0.15817782282829285,-0.030553607270121574,-0.012590909376740456,0.33777257800102234,0.1537456214427948,-0.0941174328327179,-0.12072017043828964,0.15924309194087982,-0.13973166048526764,-0.015363641083240509,0.07575816661119461,-0.13820235431194305,-0.09730701893568039,-0.3049817681312561,0.04123162850737572,0.40377938747406006,0.0844898670911789,-0.20531897246837616,-0.013761798851191998,-0.09242149442434311,-0.030495282262563705,0.07680708169937134,0.034348756074905396,-0.11287415027618408,0.006321005988866091,-0.1437063217163086,0.002888873452320695,0.1622854620218277,-0.004741585813462734,-0.05507785826921463,0.17361848056316376,-0.026538491249084473,0.04217871278524399,0.04865220934152603,-0.06340939551591873,0.03963877260684967,-0.025405554100871086,-0.14305929839611053,0.04311201721429825,0.03238530084490776,-0.08079999685287476,0.0247169341892004,0.01388419046998024,-0.11891540139913559,0.01980225183069706,0.03696192055940628,0.008626907132565975,-0.05099612474441528,0.08032208681106567,-0.19254131615161896,-0.05101536959409714,0.2074221670627594,-0.2822875678539276,0.228003591299057,0.19983765482902527,-0.060637641698122025,0.13394056260585785,0.051850005984306335,0.13492068648338318,-0.06256309151649475,-0.01784365251660347,-0.021563060581684113,-0.05731234326958656,0.08227184414863586,-0.031381409615278244,0.08888287842273712,0.0488579161465168]';
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
