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
  faceCredentials: {
    id: string;
    user_email: string;
    full_name: string;
    role: string;
    face_descriptor: string;
    thumbnail_url?: string | null;
    created_at: string;
    updated_at: string;
  }[];
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
      id: 'admin-profile-samyak',
      email: 'samyaksingh1845@gmail.com',
      full_name: 'Samyak Singh',
      role: 'ADMIN',
      is_active: true,
      avatar_url: null,
      created_at: '2026-03-01',
      updated_at: '2026-03-01',
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
  },
  faceCredentials: [
    {
      id: 'face-owner-prithibi',
      user_email: 'owner@gorepireo.in',
      full_name: 'Prithibi Mandi',
      role: 'OWNER',
      face_descriptor: '[-0.16395892202854156,0.09117715805768967,0.11492032557725906,0.03347351402044296,-0.030363623052835464,-0.06896571069955826,-0.02736346237361431,-0.11959865689277649,0.054893169552087784,-0.04884016513824463,0.2630198895931244,-0.05125940963625908,-0.18896743655204773,-0.15912584960460663,0.03945703059434891,0.15404893457889557,-0.21804837882518768,-0.11373536288738251,-0.1118142381310463,-0.11050450801849365,-0.0801917240023613,-0.038506101816892624,0.07013699412345886,0.08956583589315414,-0.04198463633656502,-0.33908572793006897,-0.10724897682666779,-0.12795500457286835,0.060237620025873184,-0.055777229368686676,0.011861123144626617,0.05847062170505524,-0.17481140792369843,-0.031888432800769806,-0.020119521766901016,0.07452396303415298,0.02925233729183674,0.002325263572856784,0.25102195143699646,-0.06250281631946564,-0.08150316774845123,-0.08184417337179184,0.06339509785175323,0.29192882776260376,0.2061060220003128,0.05889959633350372,-0.013318258337676525,0.10404142737388611,0.061429712921381,-0.238827183842659,-0.0019561632070690393,0.1315447837114334,0.12768742442131042,0.059681717306375504,0.05215461179614067,-0.15070964395999908,-0.003140017855912447,0.07221710681915283,-0.12718430161476135,0.05190125107765198,-0.0335916168987751,-0.15817782282829285,-0.030553607270121574,-0.012590909376740456,0.33777257800102234,0.1537456214427948,-0.0941174328327179,-0.12072017043828964,0.15924309194087982,-0.13973166048526764,-0.015363641083240509,0.07575816661119461,-0.13820235431194305,-0.09730701893568039,-0.3049817681312561,0.04123162850737572,0.40377938747406006,0.0844898670911789,-0.20531897246837616,-0.013761798851191998,-0.09242149442434311,-0.030495282262563705,0.07680708169937134,0.034348756074905396,-0.11287415027618408,0.006321005988866091,-0.1437063217163086,0.002888873452320695,0.1622854620218277,-0.004741585813462734,-0.05507785826921463,0.17361848056316376,-0.026538491249084473,0.04217871278524399,0.04865220934152603,-0.06340939551591873,0.03963877260684967,-0.025405554100871086,-0.14305929839611053,0.04311201721429825,0.03238530084490776,-0.08079999685287476,0.0247169341892004,0.01388419046998024,-0.11891540139913559,0.01980225183069706,0.03696192055940628,0.008626907132565975,-0.05099612474441528,0.08032208681106567,-0.19254131615161896,-0.05101536959409714,0.2074221670627594,-0.2822875678539276,0.228003591299057,0.19983765482902527,-0.060637641698122025,0.13394056260585785,0.051850005984306335,0.13492068648338318,-0.06256309151649475,-0.01784365251660347,-0.021563060581684113,-0.05731234326958656,0.08227184414863586,-0.031381409615278244,0.08888287842273712,0.0488579161465168]',
      thumbnail_url: '/faces/owner-2.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ]
};

if (process.env.NODE_ENV !== 'production') {
  globalForMock.mockStore = mockStore;
}
