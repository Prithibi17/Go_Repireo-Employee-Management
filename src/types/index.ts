export type PersonType = 'EMPLOYEE' | 'INTERN';
export type PersonStatus = 'ACTIVE' | 'COMPLETED' | 'INACTIVE' | 'TERMINATED' | 'ARCHIVED';
export type InternshipMode = 'On-site' | 'Remote' | 'Hybrid';
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Temporary';
export type IdCardStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';
export type CertificateStatus = 'DRAFT' | 'ISSUED' | 'REVOKED';
export type UserRole = 'OWNER' | 'ADMIN' | 'PEOPLE_MANAGER' | 'VIEWER';
export type TokenResourceType = 'ID_CARD' | 'CERTIFICATE';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanySettings {
  id: string;
  company_name: string;
  legal_name?: string | null;
  tagline: string;
  logo_url?: string | null;
  website: string;
  support_email: string;
  support_phone?: string | null;
  address?: string | null;
  id_default_validity_days: number;
  signatory_name?: string | null;
  signatory_designation?: string | null;
  signature_url?: string | null;
  stamp_url?: string | null;
  certificate_heading: string;
  certificate_body_template: string;
  updated_at?: string;
  updated_by?: string | null;
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Person {
  id: string;
  person_code: string;
  person_type: PersonType;
  full_name: string;
  display_name?: string | null;
  profile_photo_path?: string | null;
  personal_email?: string | null;
  company_email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address_line?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  department_id?: string | null;
  department?: Department | null;
  designation: string;
  joining_date: string;
  reporting_manager_id?: string | null;
  reporting_manager?: Person | null;
  work_location?: string | null;
  employment_type?: EmploymentType | null;
  status: PersonStatus;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  internal_notes?: string | null;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  
  // Relations
  internships?: Internship[];
  id_cards?: IdCard[];
  certificates?: Certificate[];
}

export interface Internship {
  id: string;
  person_id: string;
  college_name?: string | null;
  course?: string | null;
  specialization?: string | null;
  domain: string;
  internship_title: string;
  project_name?: string | null;
  start_date: string;
  end_date: string;
  final_end_date?: string | null;
  mode: InternshipMode;
  stipend?: string | null;
  supervisor_id?: string | null;
  supervisor?: Person | null;
  status: PersonStatus;
  completed_at?: string | null;
  completed_by?: string | null;
  completion_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IdCard {
  id: string;
  person_id: string;
  card_number: string;
  issued_at: string;
  valid_from: string;
  valid_until: string;
  status: IdCardStatus;
  verification_token_id?: string | null;
  public_verification_code: string;
  template_version: number;
  issued_by?: string | null;
  revoked_at?: string | null;
  revoked_by?: string | null;
  revocation_reason?: string | null;
  created_at: string;
  person?: Person;
}

export interface Certificate {
  id: string;
  person_id: string;
  internship_id: string;
  certificate_number: string;
  certificate_type: string;
  issue_date: string;
  status: CertificateStatus;
  verification_token_id?: string | null;
  public_verification_code: string;
  
  // Snapshots
  recipient_name_snapshot: string;
  person_code_snapshot: string;
  role_snapshot: string;
  department_snapshot: string;
  domain_snapshot?: string | null;
  project_snapshot?: string | null;
  start_date_snapshot: string;
  end_date_snapshot: string;
  duration_snapshot?: string | null;
  supervisor_name_snapshot?: string | null;
  signatory_name_snapshot?: string | null;
  signatory_designation_snapshot?: string | null;
  
  template_version: number;
  pdf_storage_path?: string | null;
  issued_by?: string | null;
  issued_at: string;
  revoked_at?: string | null;
  revoked_by?: string | null;
  revocation_reason?: string | null;
  created_at: string;
  updated_at: string;
  person?: Person;
  internship?: Internship;
}

export interface ActivityLog {
  id: string;
  actor_id?: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PublicIdVerificationResponse {
  success: boolean;
  status: IdCardStatus | 'NOT_FOUND';
  message?: string;
  card_number?: string;
  issued_at?: string;
  valid_from?: string;
  valid_until?: string;
  revocation_reason?: string | null;
  person?: {
    code: string;
    name: string;
    type: PersonType;
    designation: string;
    department: string;
    photo_url?: string | null;
  };
  company?: {
    name: string;
    tagline: string;
    website: string;
    logo_url: string;
  };
}

export interface PublicCertificateVerificationResponse {
  success: boolean;
  status: CertificateStatus | 'NOT_FOUND';
  message?: string;
  certificate_id?: string;
  certificate_number?: string;
  certificate_type?: string;
  issue_date?: string;
  revocation_reason?: string | null;
  snapshot?: {
    name: string;
    person_code: string;
    role: string;
    department: string;
    domain?: string;
    project?: string;
    start_date: string;
    end_date: string;
    duration?: string;
    signatory_name?: string;
    signatory_designation?: string;
  };
  pdf_storage_path?: string | null;
  company?: {
    name: string;
    tagline: string;
    website: string;
    logo_url: string;
  };
}

export interface PublicCardApiResponse {
  success: boolean;
  found: boolean;
  message?: string;
  card?: {
    id: string;
    card_number: string;
    status: IdCardStatus;
    issued_at: string;
    valid_from: string;
    valid_until: string;
    public_verification_code: string;
    verification_url: string;
    qr_code_data_url: string;
  } | null;
  person?: {
    id: string;
    person_code: string;
    full_name: string;
    person_type: PersonType;
    designation: string;
    department: string;
    status: PersonStatus;
    avatar_url?: string | null;
    company_email?: string | null;
    work_location?: string | null;
  } | null;
  company?: {
    name: string;
    legal_name?: string | null;
    tagline: string;
    website: string;
    support_email: string;
    logo_url: string;
    mascot_url: string;
  };
  design?: {
    theme: string;
    primary_color: string;
    accent_color: string;
    badge_color: string;
    card_dimensions: {
      width_px: number;
      height_px: number;
      aspect_ratio: string;
    };
  };
}
