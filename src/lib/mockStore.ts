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
      face_descriptor: '[-0.19448451697826385,0.09915207326412201,0.07691874355077744,0.05141860619187355,0.01332646980881691,-0.049808159470558167,-0.060547053813934326,-0.12171543389558792,0.10147202759981155,-0.08566118776798248,0.2898637652397156,-0.05552174150943756,-0.1629665493965149,-0.2007317990064621,0.023522162809967995,0.17456205189228058,-0.20453089475631714,-0.12336268275976181,-0.10955199599266052,-0.09542462974786758,-0.05823599919676781,-0.05872507765889168,0.0827554240822792,0.07996318489313126,-0.06339500099420547,-0.3703363835811615,-0.10555388778448105,-0.14744973182678223,0.06900617480278015,-0.07656745612621307,0.008601748384535313,0.05356799066066742,-0.17048072814941406,-0.027231816202402115,-0.016576852649450302,0.08614110201597214,0.022969575598835945,0.032938435673713684,0.23966719210147858,-0.08210818469524384,-0.07880672067403793,-0.06940259039402008,0.06011054664850235,0.2763820290565491,0.20442821085453033,0.08976919949054718,-0.01113011036068201,0.060062382370233536,0.08507028222084045,-0.20084670186042786,-0.0041790921241045,0.10812346637248993,0.1504046767950058,0.08013936132192612,0.06634987890720367,-0.1319166123867035,0.020635142922401428,0.055741459131240845,-0.12665311992168427,0.040294066071510315,-0.058814167976379395,-0.14508944749832153,-0.06351529061794281,0.04776819422841072,0.32984527945518494,0.13206294178962708,-0.08673620223999023,-0.12385549396276474,0.18302153050899506,-0.12804293632507324,0.011600177735090256,0.09695717692375183,-0.1166410744190216,-0.13879342377185822,-0.28556033968925476,0.042349692434072495,0.41345465183258057,0.08417343348264694,-0.2141089141368866,0.029953358694911003,-0.052763860672712326,-0.03372449427843094,0.07744819670915604,0.057679593563079834,-0.12592369318008423,-0.011618386954069138,-0.13779936730861664,-0.01812727004289627,0.15039443969726562,-0.0038798563182353973,-0.05208485573530197,0.16644735634326935,-0.012028048746287823,0.05470055714249611,0.05682533606886864,-0.06002258509397507,0.030555488541722298,-0.020940221846103668,-0.1329001933336258,-0.006214627996087074,0.05624817684292793,-0.03296287730336189,0.0065581961534917355,-0.028064772486686707,-0.10172069072723389,0.04723561927676201,0.04455779120326042,0.02405388467013836,-0.02407953143119812,0.10972969233989716,-0.16396315395832062,-0.06544036418199539,0.16121657192707062,-0.2967458963394165,0.2146686613559723,0.18686151504516602,-0.03547424077987671,0.16985361278057098,0.07384924590587616,0.14837335050106049,-0.025695500895380974,0.004731373395770788,-0.025808855891227722,-0.06806954741477966,0.08703315258026123,-0.015101414173841476,0.08012495189905167,0.030196167528629303]',
      thumbnail_url: '/faces/owner_live_crop.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'face-admin-samyak',
      user_email: 'samyaksingh1845@gmail.com',
      full_name: 'Samyak Singh',
      role: 'ADMIN',
      face_descriptor: '[-0.18632689118385315,0.13288423418998718,0.09019234031438828,-0.042598288506269455,-0.06173015385866165,0.037784185260534286,-0.006069219671189785,0.0014867085264995694,0.2127981185913086,-0.045783791691064835,0.25229451060295105,0.003616722533479333,-0.2038973569869995,-0.16719116270542145,-0.012422597967088223,0.1273728907108307,-0.1667582392692566,-0.19702547788619995,-0.0019775971304625273,-0.11575707793235779,0.03835582360625267,0.016257653012871742,-0.017705848440527916,0.028320973739027977,-0.22288765013217926,-0.32988953590393066,0.009990406222641468,-0.18414533138275146,0.0037002202589064837,-0.14062660932540894,-0.030220212414860725,0.11885585635900497,-0.25230714678764343,-0.0580999031662941,-0.03894044831395149,0.1133958250284195,0.048891764134168625,0.07754602283239365,0.13742755353450775,0.006652279291301966,-0.16818450391292572,-0.030329905450344086,0.04226639121770859,0.24798445403575897,0.17559170722961426,0.030118774622678757,0.0005924131837673485,-0.011187499389052391,0.02262265980243683,-0.2239982783794403,0.04760277643799782,0.1630009263753891,0.12634684145450592,0.044711124151945114,0.06655878573656082,-0.21044643223285675,-0.020622065290808678,-0.032572269439697266,-0.11735612899065018,0.08225736767053604,0.010461082682013512,-0.08118665963411331,-0.035851914435625076,0.028555702418088913,0.26502153277397156,0.04232124239206314,-0.05455349013209343,-0.13777992129325867,0.21905004978179932,-0.07556837052106857,-0.033887095749378204,0.18385685980319977,-0.07447157055139542,-0.16200225055217743,-0.23102544248104095,0.09856284409761429,0.3787086308002472,0.1052834764122963,-0.22850093245506287,0.08106379210948944,-0.149507075548172,-0.041060350835323334,0.03514837101101875,0.035065166652202606,-0.071001335978508,0.06835447996854782,-0.14518846571445465,0.038218431174755096,0.19967998564243317,0.045965030789375305,-0.03327737748622894,0.1924971044063568,0.00036159282899461687,0.04625484719872475,0.06679476052522659,0.013905317522585392,-0.0487002432346344,0.013859957456588745,-0.14091873168945312,-0.0784817710518837,0.07225456088781357,-0.08698850870132446,-0.06189877912402153,0.09157777577638626,-0.17449428141117096,0.08037862926721573,0.003810147289186716,-0.02552643045783043,-0.0983092412352562,0.05308046564459801,-0.0620495080947876,0.012323270551860332,0.1617274135351181,-0.2656390368938446,0.24397478997707367,0.14742474257946014,0.005926630925387144,0.16461145877838135,0.11781929433345795,0.03862783685326576,0.008218617178499699,-0.09888975322246552,-0.11355025321245193,-0.06812848150730133,0.059768665581941605,-0.10927639156579971,0.08717089891433716,0.06802204996347427]',
      thumbnail_url: '/faces/samyak.png',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ]
};

if (process.env.NODE_ENV !== 'production') {
  globalForMock.mockStore = mockStore;
}
