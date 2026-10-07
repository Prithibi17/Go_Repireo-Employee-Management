-- =========================================================================
-- Go_Repireo People - PostgreSQL & Supabase Database Migration
-- Product: Go_Repireo People (Learn • Build • Grow)
-- =========================================================================

-- Enable pgcrypto for UUID and cryptographic hashing (SHA256)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- ENUMS
-- =========================================================================
DO $$ BEGIN
  CREATE TYPE person_type_enum AS ENUM ('EMPLOYEE', 'INTERN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE person_status_enum AS ENUM ('ACTIVE', 'COMPLETED', 'INACTIVE', 'TERMINATED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE internship_mode_enum AS ENUM ('On-site', 'Remote', 'Hybrid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE employment_type_enum AS ENUM ('Full-time', 'Part-time', 'Contract', 'Temporary');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE id_card_status_enum AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE certificate_status_enum AS ENUM ('DRAFT', 'ISSUED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE token_resource_type_enum AS ENUM ('ID_CARD', 'CERTIFICATE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('OWNER', 'ADMIN', 'PEOPLE_MANAGER', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =========================================================================
-- SEQUENCES for Safe, Immutable ID & Certificate Generation
-- =========================================================================
CREATE SEQUENCE IF NOT EXISTS seq_employee_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS seq_intern_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS seq_certificate_number START WITH 1 INCREMENT BY 1;

-- =========================================================================
-- 1. PROFILES & ROLES (Internal Memberships)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'VIEWER',
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =========================================================================
-- 2. COMPANY SETTINGS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'Go_Repireo',
  legal_name TEXT DEFAULT 'Go_Repireo Technologies Private Limited',
  tagline TEXT NOT NULL DEFAULT 'Learn • Build • Grow',
  logo_url TEXT DEFAULT '/gorepireo-logo.png',
  website TEXT DEFAULT 'https://gorepireo.in',
  support_email TEXT DEFAULT 'contact@gorepireo.in',
  support_phone TEXT DEFAULT '+91 98765 43210',
  address TEXT DEFAULT 'Kolkata, West Bengal, India',
  id_default_validity_days INT NOT NULL DEFAULT 365,
  signatory_name TEXT DEFAULT 'Authorized Representative',
  signatory_designation TEXT DEFAULT 'Director / Founder',
  signature_url TEXT,
  stamp_url TEXT,
  certificate_heading TEXT DEFAULT 'CERTIFICATE OF INTERNSHIP',
  certificate_body_template TEXT DEFAULT 'This is to certify that {{NAME}} has successfully completed an internship as {{ROLE}} with Go_Repireo from {{START_DATE}} to {{END_DATE}}. During the internship, the candidate contributed to {{PROJECT}}. We appreciate their dedication and wish them success in their future endeavors.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Ensure a single default row exists
INSERT INTO public.company_settings (company_name, tagline, website, support_email)
SELECT 'Go_Repireo', 'Learn • Build • Grow', 'https://gorepireo.in', 'contact@gorepireo.in'
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings);

-- =========================================================================
-- 3. DEPARTMENTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Seed initial departments
INSERT INTO public.departments (name, display_order)
VALUES 
  ('Technology', 1),
  ('Operations', 2),
  ('Design', 3),
  ('Marketing', 4),
  ('Business Development', 5),
  ('Finance', 6),
  ('Management', 7),
  ('Other', 8)
ON CONFLICT (name) DO NOTHING;

-- =========================================================================
-- 4. PEOPLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_code TEXT UNIQUE NOT NULL, -- GR-EMP-0001 or GR-INT-0001
  person_type person_type_enum NOT NULL,
  
  -- Basic details
  full_name TEXT NOT NULL,
  display_name TEXT,
  profile_photo_path TEXT,
  personal_email TEXT,
  company_email TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  
  -- Address
  address_line TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'India',
  
  -- Professional
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  designation TEXT NOT NULL,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reporting_manager_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  work_location TEXT DEFAULT 'Kolkata, WB',
  employment_type employment_type_enum DEFAULT 'Full-time',
  
  -- Status
  status person_status_enum NOT NULL DEFAULT 'ACTIVE',
  
  -- Private Internal HR
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  internal_notes TEXT,
  
  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_people_code ON public.people(person_code);
CREATE INDEX IF NOT EXISTS idx_people_status ON public.people(status);
CREATE INDEX IF NOT EXISTS idx_people_type ON public.people(person_type);
CREATE INDEX IF NOT EXISTS idx_people_name ON public.people(full_name);

-- =========================================================================
-- 5. INTERNSHIPS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  
  college_name TEXT,
  course TEXT,
  specialization TEXT,
  domain TEXT NOT NULL DEFAULT 'Software Engineering',
  internship_title TEXT NOT NULL, -- e.g. "Software Development Intern"
  project_name TEXT,
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  final_end_date DATE,
  mode internship_mode_enum NOT NULL DEFAULT 'Remote',
  stipend TEXT,
  
  supervisor_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  status person_status_enum NOT NULL DEFAULT 'ACTIVE',
  
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),
  completion_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_internships_person ON public.internships(person_id);
CREATE INDEX IF NOT EXISTS idx_internships_status ON public.internships(status);
CREATE INDEX IF NOT EXISTS idx_internships_end_date ON public.internships(end_date);

-- =========================================================================
-- 6. VERIFICATION TOKENS (Cryptographically unpredictable tokens)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT UNIQUE NOT NULL, -- SHA-256 of public raw token
  raw_token_prefix TEXT NOT NULL,  -- e.g. id_v_... or crt_v_... prefix hint
  resource_type token_resource_type_enum NOT NULL,
  resource_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, REVOKED, EXPIRED
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_verification_token_hash ON public.verification_tokens(token_hash);

-- =========================================================================
-- 7. ID CARDS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.id_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE RESTRICT,
  card_number TEXT UNIQUE NOT NULL, -- IDC-GR-INT-0001-v1
  issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,
  status id_card_status_enum NOT NULL DEFAULT 'ACTIVE',
  
  verification_token_id UUID REFERENCES public.verification_tokens(id),
  public_verification_code TEXT NOT NULL, -- The unhashed code passed to QR /verify/id/[code]
  
  template_version INT NOT NULL DEFAULT 1,
  issued_by UUID REFERENCES public.profiles(id),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.profiles(id),
  revocation_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_id_cards_person ON public.id_cards(person_id);
CREATE INDEX IF NOT EXISTS idx_id_cards_status ON public.id_cards(status);

-- =========================================================================
-- 8. CERTIFICATES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE RESTRICT,
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE RESTRICT,
  certificate_number TEXT UNIQUE NOT NULL, -- GR/INT/2026/0001
  certificate_type TEXT NOT NULL DEFAULT 'INTERNSHIP_COMPLETION',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status certificate_status_enum NOT NULL DEFAULT 'ISSUED',
  
  verification_token_id UUID REFERENCES public.verification_tokens(id),
  public_verification_code TEXT NOT NULL, -- Passed in /verify/certificate/[code]
  
  -- Immutable Snapshots at time of issuance
  recipient_name_snapshot TEXT NOT NULL,
  person_code_snapshot TEXT NOT NULL,
  role_snapshot TEXT NOT NULL,
  department_snapshot TEXT NOT NULL,
  domain_snapshot TEXT,
  project_snapshot TEXT,
  start_date_snapshot DATE NOT NULL,
  end_date_snapshot DATE NOT NULL,
  duration_snapshot TEXT,
  supervisor_name_snapshot TEXT,
  signatory_name_snapshot TEXT,
  signatory_designation_snapshot TEXT,
  
  template_version INT NOT NULL DEFAULT 1,
  pdf_storage_path TEXT,
  
  issued_by UUID REFERENCES public.profiles(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.profiles(id),
  revocation_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_certificates_person ON public.certificates(person_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON public.certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);

-- =========================================================================
-- 9. ACTIVITY / AUDIT LOG
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL DEFAULT 'System',
  action TEXT NOT NULL, -- PERSON_CREATED, ID_ISSUED, CERTIFICATE_ISSUED, etc.
  entity_type TEXT NOT NULL, -- PERSON, ID_CARD, INTERNSHIP, CERTIFICATE, SETTINGS
  entity_id UUID NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_activity_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON public.activity_logs(created_at DESC);

-- =========================================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role_enum AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_authenticated_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles: Authenticated users can view; Users can edit own name/avatar; Owner can edit roles
CREATE POLICY "Profiles read by authenticated staff" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_authenticated_staff());

CREATE POLICY "Profiles update by owner or self" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.current_user_role() = 'OWNER');

-- Company Settings: Read by all authenticated staff, write by OWNER or ADMIN
CREATE POLICY "Company settings read" ON public.company_settings
  FOR SELECT TO authenticated USING (public.is_authenticated_staff());

CREATE POLICY "Company settings write" ON public.company_settings
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('OWNER', 'ADMIN'));

-- Departments: Read by staff, write by OWNER or ADMIN
CREATE POLICY "Departments read" ON public.departments
  FOR SELECT TO authenticated USING (public.is_authenticated_staff());

CREATE POLICY "Departments write" ON public.departments
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('OWNER', 'ADMIN'));

-- People: Read by staff; Insert/Update by OWNER, ADMIN, PEOPLE_MANAGER
CREATE POLICY "People read" ON public.people
  FOR SELECT TO authenticated USING (public.is_authenticated_staff());

CREATE POLICY "People write" ON public.people
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('OWNER', 'ADMIN', 'PEOPLE_MANAGER'));

-- Internships: Read by staff; Write by OWNER, ADMIN, PEOPLE_MANAGER
CREATE POLICY "Internships read" ON public.internships
  FOR SELECT TO authenticated USING (public.is_authenticated_staff());

CREATE POLICY "Internships write" ON public.internships
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('OWNER', 'ADMIN', 'PEOPLE_MANAGER'));

-- ID Cards: Read by staff; Write by OWNER, ADMIN, PEOPLE_MANAGER
CREATE POLICY "ID cards read" ON public.id_cards
  FOR SELECT TO authenticated USING (public.is_authenticated_staff());

CREATE POLICY "ID cards write" ON public.id_cards
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('OWNER', 'ADMIN', 'PEOPLE_MANAGER'));

-- Certificates: Read by staff; Write only by OWNER, ADMIN
CREATE POLICY "Certificates read" ON public.certificates
  FOR SELECT TO authenticated USING (public.is_authenticated_staff());

CREATE POLICY "Certificates write" ON public.certificates
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('OWNER', 'ADMIN'));

-- Activity Logs: Read by staff; Insert by staff; Never update or delete
CREATE POLICY "Activity read" ON public.activity_logs
  FOR SELECT TO authenticated USING (public.is_authenticated_staff());

CREATE POLICY "Activity insert" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_authenticated_staff());

-- Verification tokens: Staff can read/write; Anons do NOT get direct table SELECT
CREATE POLICY "Tokens staff read" ON public.verification_tokens
  FOR SELECT TO authenticated USING (public.is_authenticated_staff());

CREATE POLICY "Tokens staff write" ON public.verification_tokens
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('OWNER', 'ADMIN', 'PEOPLE_MANAGER'));

-- =========================================================================
-- 11. ATOMIC ID & CERTIFICATE GENERATION FUNCTIONS (Safe, Concurrency-Proof)
-- =========================================================================

-- Generate Immutable Person Code: GR-EMP-0001 or GR-INT-0001
CREATE OR REPLACE FUNCTION public.generate_person_code(p_type person_type_enum)
RETURNS TEXT AS $$
DECLARE
  v_seq_val BIGINT;
  v_code TEXT;
BEGIN
  IF p_type = 'EMPLOYEE' THEN
    v_seq_val := nextval('public.seq_employee_id');
    v_code := 'GR-EMP-' || lpad(v_seq_val::text, 4, '0');
  ELSE
    v_seq_val := nextval('public.seq_intern_id');
    v_code := 'GR-INT-' || lpad(v_seq_val::text, 4, '0');
  END IF;
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate Immutable Certificate Number: GR/INT/2026/0001
CREATE OR REPLACE FUNCTION public.generate_certificate_number(p_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT)
RETURNS TEXT AS $$
DECLARE
  v_seq_val BIGINT;
  v_num TEXT;
BEGIN
  v_seq_val := nextval('public.seq_certificate_number');
  v_num := 'GR/INT/' || p_year::text || '/' || lpad(v_seq_val::text, 4, '0');
  RETURN v_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 12. PUBLIC RPC VERIFICATION FUNCTIONS (Strictly Sanitized Boundary)
-- =========================================================================

-- Public ID Verification RPC
-- Resolves SHA256(incoming token) -> ID Card -> Sanitized Fields
CREATE OR REPLACE FUNCTION public.get_public_id_verification(p_raw_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_hash TEXT;
  v_token_rec RECORD;
  v_card RECORD;
  v_person RECORD;
  v_dept RECORD;
  v_company RECORD;
BEGIN
  -- Hash the incoming raw token
  v_hash := encode(digest(p_raw_token, 'sha256'), 'hex');

  -- Look up verification token record
  SELECT * INTO v_token_rec 
  FROM public.verification_tokens 
  WHERE token_hash = v_hash AND resource_type = 'ID_CARD';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'status', 'NOT_FOUND', 'message', 'Verification Not Found');
  END IF;

  -- Fetch ID Card
  SELECT * INTO v_card FROM public.id_cards WHERE id = v_token_rec.resource_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'status', 'NOT_FOUND', 'message', 'ID record not found');
  END IF;

  -- Fetch Person (Sanitized Public fields only)
  SELECT id, person_code, person_type, full_name, display_name, profile_photo_path, designation, department_id, status 
  INTO v_person FROM public.people WHERE id = v_card.person_id;

  -- Fetch Department
  SELECT name INTO v_dept FROM public.departments WHERE id = v_person.department_id;

  -- Fetch Company info
  SELECT company_name, tagline, website, logo_url INTO v_company FROM public.company_settings LIMIT 1;

  -- Return sanitized response
  RETURN jsonb_build_object(
    'success', true,
    'status', v_card.status, -- ACTIVE, REVOKED, EXPIRED
    'card_number', v_card.card_number,
    'issued_at', v_card.issued_at,
    'valid_from', v_card.valid_from,
    'valid_until', v_card.valid_until,
    'revocation_reason', CASE WHEN v_card.status = 'REVOKED' THEN v_card.revocation_reason ELSE NULL END,
    'person', jsonb_build_object(
      'code', v_person.person_code,
      'name', v_person.full_name,
      'type', v_person.person_type,
      'designation', v_person.designation,
      'department', coalesce(v_dept.name, 'General'),
      'photo_url', v_person.profile_photo_path
    ),
    'company', jsonb_build_object(
      'name', coalesce(v_company.company_name, 'Go_Repireo'),
      'tagline', coalesce(v_company.tagline, 'Learn • Build • Grow'),
      'website', coalesce(v_company.website, 'https://gorepireo.in'),
      'logo_url', coalesce(v_company.logo_url, '/gorepireo-logo.png')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public Certificate Verification RPC
CREATE OR REPLACE FUNCTION public.get_public_certificate_verification(p_raw_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_hash TEXT;
  v_token_rec RECORD;
  v_cert RECORD;
  v_company RECORD;
BEGIN
  -- Hash incoming token
  v_hash := encode(digest(p_raw_token, 'sha256'), 'hex');

  SELECT * INTO v_token_rec 
  FROM public.verification_tokens 
  WHERE token_hash = v_hash AND resource_type = 'CERTIFICATE';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'status', 'NOT_FOUND', 'message', 'Certificate verification record not found');
  END IF;

  SELECT * INTO v_cert FROM public.certificates WHERE id = v_token_rec.resource_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'status', 'NOT_FOUND', 'message', 'Certificate record not found');
  END IF;

  SELECT company_name, tagline, website, logo_url INTO v_company FROM public.company_settings LIMIT 1;

  RETURN jsonb_build_object(
    'success', true,
    'status', v_cert.status, -- ISSUED (VALID), REVOKED
    'certificate_number', v_cert.certificate_number,
    'certificate_type', v_cert.certificate_type,
    'issue_date', v_cert.issue_date,
    'revocation_reason', CASE WHEN v_cert.status = 'REVOKED' THEN v_cert.revocation_reason ELSE NULL END,
    'snapshot', jsonb_build_object(
      'name', v_cert.recipient_name_snapshot,
      'person_code', v_cert.person_code_snapshot,
      'role', v_cert.role_snapshot,
      'department', v_cert.department_snapshot,
      'domain', v_cert.domain_snapshot,
      'project', v_cert.project_snapshot,
      'start_date', v_cert.start_date_snapshot,
      'end_date', v_cert.end_date_snapshot,
      'duration', v_cert.duration_snapshot,
      'signatory_name', v_cert.signatory_name_snapshot,
      'signatory_designation', v_cert.signatory_designation_snapshot
    ),
    'pdf_storage_path', v_cert.pdf_storage_path,
    'company', jsonb_build_object(
      'name', coalesce(v_company.company_name, 'Go_Repireo'),
      'tagline', coalesce(v_company.tagline, 'Learn • Build • Grow'),
      'website', coalesce(v_company.website, 'https://gorepireo.in'),
      'logo_url', coalesce(v_company.logo_url, '/gorepireo-logo.png')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant EXECUTE to public/anon for verification functions
GRANT EXECUTE ON FUNCTION public.get_public_id_verification(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_certificate_verification(TEXT) TO anon, authenticated;
