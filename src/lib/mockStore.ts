// In-memory demo store to ensure all core workflows execute seamlessly 
// even before connecting to a live Supabase project instance.

import { 
  Person, Internship, IdCard, Certificate, ActivityLog, 
  CompanySettings, Department, Profile, PublicIdVerificationResponse,
  PublicCertificateVerificationResponse
} from '@/types';
import { hashToken } from './tokens';

interface StorageState {
  companySettings: CompanySettings;
  departments: Department[];
  profiles: Profile[];
  people: Person[];
  internships: Internship[];
  idCards: IdCard[];
  certificates: Certificate[];
  tokens: {
    id: string;
    token_hash: string;
    resource_type: 'ID_CARD' | 'CERTIFICATE';
    resource_id: string;
    status: string;
    created_at: string;
    revoked_at?: string | null;
  }[];
  activityLogs: ActivityLog[];
  sequences: {
    employee: number;
    intern: number;
    certificate: number;
  };
}

const globalForMock = globalThis as unknown as { mockStore?: StorageState };

export const mockStore: StorageState = globalForMock.mockStore || {
  companySettings: {
    id: 'default-company-settings',
    company_name: 'Go_Repireo',
    legal_name: 'Go_Repireo Technologies Pvt. Ltd.',
    tagline: 'Learn • Build • Grow',
    logo_url: '/gorepireo-logo.png',
    website: 'https://gorepireo.in',
    support_email: 'contact@gorepireo.in',
    support_phone: '+91 98765 43210',
    address: 'Kolkata, West Bengal, India',
    id_default_validity_days: 365,
    signatory_name: 'Prithibi Mandi',
    signatory_designation: 'Founder & CEO',
    signature_url: null,
    stamp_url: null,
    certificate_heading: 'CERTIFICATE OF INTERNSHIP',
    certificate_body_template: 'This is to certify that {{NAME}} has successfully completed an internship as {{ROLE}} with Go_Repireo from {{START_DATE}} to {{END_DATE}}. During the internship, the candidate contributed to {{PROJECT}}. We appreciate their dedication and wish them success in their future endeavors.',
  },
  departments: [
    { id: 'dept-1', name: 'Technology', display_order: 1, is_active: true, created_at: '2026-01-01' },
    { id: 'dept-2', name: 'Operations', display_order: 2, is_active: true, created_at: '2026-01-01' },
    { id: 'dept-3', name: 'Design', display_order: 3, is_active: true, created_at: '2026-01-01' },
    { id: 'dept-4', name: 'Marketing', display_order: 4, is_active: true, created_at: '2026-01-01' },
    { id: 'dept-5', name: 'Business Development', display_order: 5, is_active: true, created_at: '2026-01-01' },
    { id: 'dept-6', name: 'Finance', display_order: 6, is_active: true, created_at: '2026-01-01' },
    { id: 'dept-7', name: 'Management', display_order: 7, is_active: true, created_at: '2026-01-01' },
    { id: 'dept-8', name: 'Other', display_order: 8, is_active: true, created_at: '2026-01-01' },
  ],
  profiles: [
    {
      id: 'owner-profile-1',
      email: 'owner@gorepireo.in',
      full_name: 'Prithibi Mandi',
      role: 'OWNER',
      is_active: true,
      avatar_url: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'admin-profile-2',
      email: 'admin@gorepireo.in',
      full_name: 'Ananya Roy',
      role: 'ADMIN',
      is_active: true,
      avatar_url: null,
      created_at: '2026-02-01',
      updated_at: '2026-02-01',
    },
    {
      id: 'manager-profile-3',
      email: 'manager@gorepireo.in',
      full_name: 'Subhashish Sen',
      role: 'PEOPLE_MANAGER',
      is_active: true,
      avatar_url: null,
      created_at: '2026-03-01',
      updated_at: '2026-03-01',
    }
  ],
  people: [
    {
      id: 'p-1',
      person_code: 'GRI-5M8K2P7',
      person_type: 'INTERN',
      full_name: 'Aarav Sharma',
      display_name: 'Aarav',
      profile_photo_path: null,
      personal_email: 'aarav.sharma@example.com',
      company_email: 'aarav@gorepireo.in',
      phone: '+91 98765 11223',
      date_of_birth: '2004-05-14',
      gender: 'Male',
      address_line: 'Salt Lake Sector V',
      city: 'Kolkata',
      state: 'West Bengal',
      postal_code: '700091',
      country: 'India',
      department_id: 'dept-1',
      designation: 'Software Development Intern',
      joining_date: '2026-07-01',
      work_location: 'Kolkata, WB',
      status: 'ACTIVE',
      emergency_contact_name: 'Rajesh Sharma (Father)',
      emergency_contact_phone: '+91 98765 99887',
      internal_notes: 'High performer working on web applications and API integrations.',
      created_at: '2026-07-01T10:00:00Z',
      updated_at: '2026-07-01T10:00:00Z',
    },
    {
      id: 'p-2',
      person_code: 'GRI-8W3N9L1',
      person_type: 'INTERN',
      full_name: 'Pooja Bannerjee',
      display_name: 'Pooja',
      profile_photo_path: null,
      personal_email: 'pooja.b@example.com',
      company_email: 'pooja@gorepireo.in',
      phone: '+91 98765 44556',
      date_of_birth: '2003-11-20',
      gender: 'Female',
      address_line: 'New Town Action Area 1',
      city: 'Kolkata',
      state: 'West Bengal',
      postal_code: '700156',
      country: 'India',
      department_id: 'dept-3',
      designation: 'UI/UX Design Intern',
      joining_date: '2026-08-01',
      work_location: 'Hybrid',
      status: 'ACTIVE',
      emergency_contact_name: 'Mitali Bannerjee',
      emergency_contact_phone: '+91 98765 33221',
      internal_notes: 'Assisting brand design and mobile responsive UI kits.',
      created_at: '2026-08-01T11:00:00Z',
      updated_at: '2026-08-01T11:00:00Z',
    },
    {
      id: 'p-3',
      person_code: 'GRE-7K4M2P9',
      person_type: 'EMPLOYEE',
      full_name: 'Prithibi Mandi',
      display_name: 'Prithibi',
      profile_photo_path: null,
      personal_email: 'prithibi.dev@example.com',
      company_email: 'prithibi@gorepireo.in',
      phone: '+91 98765 67890',
      date_of_birth: '2001-09-17',
      gender: 'Male',
      address_line: 'Park Street Area',
      city: 'Kolkata',
      state: 'West Bengal',
      postal_code: '700016',
      country: 'India',
      department_id: 'dept-1',
      designation: 'Lead Architect & Systems Engineer',
      joining_date: '2026-01-01',
      work_location: 'Kolkata, WB',
      employment_type: 'Full-time',
      status: 'ACTIVE',
      created_at: '2026-01-01T09:00:00Z',
      updated_at: '2026-01-01T09:00:00Z',
    }
  ],
  internships: [
    {
      id: 'int-1',
      person_id: 'p-1',
      college_name: 'Heritage Institute of Technology',
      course: 'B.Tech',
      specialization: 'Computer Science & Engineering',
      domain: 'Full Stack Web Development',
      internship_title: 'Software Development Intern',
      project_name: 'Go_Repireo People Platform',
      start_date: '2026-07-01',
      end_date: '2026-10-15',
      mode: 'Remote',
      stipend: '₹12,000 / month',
      status: 'ACTIVE',
      created_at: '2026-07-01T10:00:00Z',
      updated_at: '2026-07-01T10:00:00Z',
    },
    {
      id: 'int-2',
      person_id: 'p-2',
      college_name: 'St. Xavier’s College',
      course: 'B.Sc Multimedia',
      specialization: 'Visual Communication',
      domain: 'UI/UX & Product Design',
      internship_title: 'UI/UX Design Intern',
      project_name: 'Go_Repireo Brand Identity and Mobile Screens',
      start_date: '2026-08-01',
      end_date: '2026-11-01',
      mode: 'Hybrid',
      stipend: '₹10,000 / month',
      status: 'ACTIVE',
      created_at: '2026-08-01T11:00:00Z',
      updated_at: '2026-08-01T11:00:00Z',
    }
  ],
  idCards: [
    {
      id: 'idc-1',
      person_id: 'p-1',
      card_number: 'IDC-5M8K2P7',
      issued_at: '2026-07-02T10:00:00Z',
      valid_from: '2026-07-02',
      valid_until: '2027-07-02',
      status: 'ACTIVE',
      verification_token_id: 'tok-idc-1',
      public_verification_code: 'id_v_DEMO_AARAV_5M8K2P7',
      template_version: 1,
      issued_by: 'owner-profile-1',
      created_at: '2026-07-02T10:00:00Z',
    }
  ],
  certificates: [],
  tokens: [
    {
      id: 'tok-idc-1',
      token_hash: hashToken('id_v_DEMO_AARAV_5M8K2P7'),
      resource_type: 'ID_CARD',
      resource_id: 'idc-1',
      status: 'ACTIVE',
      created_at: '2026-07-02T10:00:00Z',
    }
  ],
  activityLogs: [
    {
      id: 'act-1',
      actor_id: 'owner-profile-1',
      actor_name: 'Prithibi Mandi (Owner)',
      action: 'PERSON_CREATED',
      entity_type: 'PERSON',
      entity_id: 'p-1',
      metadata: { code: 'GRI-5M8K2P7', name: 'Aarav Sharma' },
      created_at: '2026-07-01T10:00:00Z',
    },
    {
      id: 'act-2',
      actor_id: 'owner-profile-1',
      actor_name: 'Prithibi Mandi (Owner)',
      action: 'ID_ISSUED',
      entity_type: 'ID_CARD',
      entity_id: 'idc-1',
      metadata: { code: 'IDC-5M8K2P7' },
      created_at: '2026-07-02T10:00:00Z',
    }
  ],
  sequences: {
    employee: 1,
    intern: 2,
    certificate: 0,
  }
};

if (process.env.NODE_ENV !== 'production') {
  globalForMock.mockStore = mockStore;
}
