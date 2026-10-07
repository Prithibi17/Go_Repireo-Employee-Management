import { z } from 'zod';

export const personSchema = z.object({
  person_type: z.enum(['EMPLOYEE', 'INTERN']),
  full_name: z.string().min(2, 'Full name must have at least 2 characters'),
  display_name: z.string().optional().nullable(),
  profile_photo_path: z.string().optional().nullable(),
  personal_email: z.string().email('Invalid personal email format').optional().or(z.literal('')).nullable(),
  company_email: z.string().email('Invalid company email format').optional().or(z.literal('')).nullable(),
  phone: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  address_line: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  country: z.string().default('India'),
  department_id: z.string().optional().nullable(),
  designation: z.string().min(2, 'Designation / Role Title is required'),
  joining_date: z.string().optional().default(() => new Date().toISOString().split('T')[0]),
  reporting_manager_id: z.string().optional().nullable(),
  work_location: z.string().default('Kolkata, WB'),
  employment_type: z.enum(['Full-time', 'Part-time', 'Contract', 'Temporary']).optional().nullable(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'INACTIVE', 'TERMINATED', 'ARCHIVED']).default('ACTIVE'),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
  internal_notes: z.string().optional().nullable(),
  // Intern specific optional fields in the same creation form
  college_name: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  domain: z.string().optional().nullable(),
  internship_title: z.string().optional().nullable(),
  project_name: z.string().optional().nullable(),
  internship_start_date: z.string().optional().nullable(),
  internship_end_date: z.string().optional().nullable(),
  internship_mode: z.enum(['On-site', 'Remote', 'Hybrid']).default('Remote'),
  stipend: z.string().optional().nullable(),
});

export type PersonFormData = z.infer<typeof personSchema>;

export const companySettingsSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  legal_name: z.string().optional().nullable(),
  tagline: z.string().min(2, 'Tagline is required'),
  website: z.string().url('Invalid website URL').or(z.literal('')),
  support_email: z.string().email('Invalid support email'),
  support_phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  id_default_validity_days: z.number().int().positive().default(365),
  signatory_name: z.string().optional().nullable(),
  signatory_designation: z.string().optional().nullable(),
  certificate_heading: z.string().min(3),
  certificate_body_template: z.string().min(10),
});

export const completeInternshipSchema = z.object({
  internship_id: z.string().min(1, 'Internship ID is required'),
  final_end_date: z.string().min(4, 'Final end date is required'),
  completion_notes: z.string().optional().nullable(),
  deactivate_id_card: z.boolean().default(false),
});

export const issueCertificateSchema = z.object({
  person_id: z.string().min(1, 'Person ID is required'),
  internship_id: z.string().min(1, 'Internship ID is required'),
  recipient_name: z.string().min(2),
  role: z.string().min(2),
  department: z.string().min(2),
  domain: z.string().optional().nullable(),
  project: z.string().optional().nullable(),
  start_date: z.string().min(4),
  end_date: z.string().min(4),
  issue_date: z.string().min(4),
  signatory_name: z.string().optional().nullable(),
  signatory_designation: z.string().optional().nullable(),
});

export const revokeResourceSchema = z.object({
  resource_id: z.string().min(1, 'Resource ID is required'),
  revocation_reason: z.string().min(3, 'Revocation reason is required'),
});
