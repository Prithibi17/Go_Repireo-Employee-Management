-- Optional Seed Data for Development
-- Note: Replace '<YOUR-USER-UUID>' with your actual auth.users id if testing with local profiles

-- Insert demo departments
INSERT INTO public.departments (name, display_order)
VALUES 
  ('Technology', 1),
  ('Operations', 2),
  ('Design', 3),
  ('Marketing', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert demo intern
INSERT INTO public.people (
  id, person_code, person_type, full_name, display_name,
  personal_email, company_email, phone,
  designation, joining_date, status, work_location
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'GR-INT-0001',
  'INTERN',
  'Aarav Sharma',
  'Aarav',
  'aarav.sharma.demo@gmail.com',
  'aarav@gorepireo.in',
  '+91 98765 12345',
  'Software Development Intern',
  '2026-08-01',
  'ACTIVE',
  'Kolkata, WB'
) ON CONFLICT (person_code) DO NOTHING;

-- Insert demo internship for Aarav
INSERT INTO public.internships (
  id, person_id, college_name, course, domain,
  internship_title, project_name, start_date, end_date, mode, status
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Heritage Institute of Technology',
  'B.Tech Computer Science',
  'Full Stack Web Development',
  'Software Development Intern',
  'Go_Repireo Portal V1',
  '2026-08-01',
  '2026-11-01',
  'Remote',
  'ACTIVE'
) ON CONFLICT DO NOTHING;

-- Insert demo employee
INSERT INTO public.people (
  id, person_code, person_type, full_name, display_name,
  personal_email, company_email, phone,
  designation, joining_date, status, work_location, employment_type
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'GR-EMP-0001',
  'EMPLOYEE',
  'Prithibi Mandi',
  'Prithibi',
  'prithibi.mandi@gmail.com',
  'prithibi@gorepireo.in',
  '+91 98765 67890',
  'Lead Systems Engineer',
  '2026-01-15',
  'ACTIVE',
  'Kolkata, WB',
  'Full-time'
) ON CONFLICT (person_code) DO NOTHING;
