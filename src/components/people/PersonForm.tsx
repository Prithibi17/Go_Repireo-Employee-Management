import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Department, Person } from '@/types';
import { UserCheck, GraduationCap, ArrowLeft, Upload, Shield } from 'lucide-react';

interface PersonFormProps {
  departments: Department[];
  managers: Person[];
  initialData?: any;
  personId?: string;
}

export function PersonForm({ departments, managers, initialData, personId }: PersonFormProps) {
  const navigate = useNavigate();
  const isEditing = Boolean(personId && initialData);
  const [personType, setPersonType] = useState<'EMPLOYEE' | 'INTERN'>(initialData?.person_type || 'INTERN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Active internship if available
  const activeInt = initialData?.internships?.[0];

  // Form State
  const [formData, setFormData] = useState({
    // Basic
    full_name: initialData?.full_name || '',
    display_name: initialData?.display_name || '',
    profile_photo_path: initialData?.profile_photo_path || '',
    personal_email: initialData?.personal_email || '',
    company_email: initialData?.company_email || '',
    phone: initialData?.phone || '',
    date_of_birth: initialData?.date_of_birth || '',
    gender: initialData?.gender || 'Male',
    address_line: initialData?.address_line || '',
    city: initialData?.city || 'Kolkata',
    state: initialData?.state || 'West Bengal',
    postal_code: initialData?.postal_code || '',
    country: initialData?.country || 'India',

    // Professional
    department_id: initialData?.department_id || departments[0]?.id || '',
    designation: initialData?.designation || '',
    joining_date: initialData?.joining_date || new Date().toISOString().split('T')[0],
    reporting_manager_id: initialData?.reporting_manager_id || '',
    work_location: initialData?.work_location || 'Kolkata, WB',
    employment_type: initialData?.employment_type || 'Full-time',

    // Private HR
    emergency_contact_name: initialData?.emergency_contact_name || '',
    emergency_contact_phone: initialData?.emergency_contact_phone || '',
    internal_notes: initialData?.internal_notes || '',

    // Intern Specific
    college_name: activeInt?.college_name || initialData?.college_name || '',
    course: activeInt?.course || initialData?.course || '',
    specialization: activeInt?.specialization || initialData?.specialization || '',
    domain: activeInt?.domain || initialData?.domain || 'Full Stack Web Development',
    internship_title: activeInt?.internship_title || initialData?.internship_title || 'Software Development Intern',
    project_name: activeInt?.project_name || initialData?.project_name || '',
    internship_start_date: activeInt?.start_date || initialData?.internship_start_date || new Date().toISOString().split('T')[0],
    internship_end_date: activeInt?.end_date || initialData?.internship_end_date || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    internship_mode: activeInt?.mode || initialData?.internship_mode || 'Remote',
    stipend: activeInt?.stipend || initialData?.stipend || '₹10,000 / month',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, profile_photo_path: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        const res = await fetch(`/api/people/${personId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            designation: formData.designation || (personType === 'INTERN' ? formData.internship_title : 'Engineer'),
          }),
        });

        const result = await res.json().catch(() => ({}));
        if (res.ok && result.success && result.person?.id) {
          navigate(`/people/${result.person.id}`);
        } else {
          setError(result.error || `Failed to update person record (HTTP ${res.status})`);
        }
      } else {
        const res = await fetch('/api/people', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            person_type: personType,
            designation: formData.designation || (personType === 'INTERN' ? formData.internship_title : 'Engineer'),
          }),
        });

        const result = await res.json().catch(() => ({}));
        if (res.ok && result.success && result.person?.id) {
          navigate(`/people/${result.person.id}`);
        } else {
          setError(result.error || `Failed to create person record (HTTP ${res.status})`);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred while saving the record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 1. Step 1: Person Type Selection */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          {isEditing ? `Identity: ${initialData?.person_code || ''}` : '1. Select Person Type'}
        </h2>
        <p className="text-xs text-slate-500">
          {isEditing
            ? 'The person identifier and sequence cannot be modified after registration.'
            : 'The system will safely generate a permanent, secure unique Staff ID (GRE-XXXXXXX or GRI-XXXXXXX).'}
        </p>

        {!isEditing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                personType === 'INTERN'
                  ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="person_type"
                checked={personType === 'INTERN'}
                onChange={() => setPersonType('INTERN')}
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                  <GraduationCap className="w-4 h-4 text-teal-600" />
                  Intern
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Generates <code className="text-slate-800 font-semibold">GRI-XXXXXXX</code>. Unlocks college details, internship project tracking, ID issuance, and certificate generation upon completion.
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                personType === 'EMPLOYEE'
                  ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="person_type"
                checked={personType === 'EMPLOYEE'}
                onChange={() => setPersonType('EMPLOYEE')}
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Employee
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Generates <code className="text-slate-800 font-semibold">GRE-XXXXXXX</code>. Full-time or contract staff with employment details, department roles, and official ID credentials.
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* 2. Basic Information */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">2. Basic Information</h2>

        {/* Profile Photo */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-2 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full border border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
            {formData.profile_photo_path ? (
              <img
                src={formData.profile_photo_path}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <Upload className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload Profile Photo (for ID card)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">JPG or PNG, square portrait recommended</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Legal Name <span className="text-red-500">*</span>
              <span className="text-[10px] text-blue-600 font-normal ml-1.5">(Shows on ID)</span>
            </label>
            <input
              type="text"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g. Aarav Sharma"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preferred / Display Name
            </label>
            <input
              type="text"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              placeholder="e.g. Aarav"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Personal Email
            </label>
            <input
              type="email"
              name="personal_email"
              value={formData.personal_email}
              onChange={handleChange}
              placeholder="aarav@gmail.com"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Company Email
            </label>
            <input
              type="email"
              name="company_email"
              value={formData.company_email}
              onChange={handleChange}
              placeholder="aarav@gorepireo.in"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* 3. Professional Information */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">3. Professional Information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department <span className="text-red-500">*</span>
              <span className="text-[10px] text-blue-600 font-normal ml-1.5">(Shows on ID)</span>
            </label>
            <select
              name="department_id"
              required
              value={formData.department_id}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Designation / Role Title <span className="text-red-500">*</span>
              <span className="text-[10px] text-blue-600 font-normal ml-1.5">(Shows on ID)</span>
            </label>
            <input
              type="text"
              name="designation"
              required
              value={formData.designation}
              onChange={handleChange}
              placeholder={personType === 'INTERN' ? 'e.g. Software Development Intern' : 'e.g. Frontend Engineer'}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Joining Date <span className="text-slate-400 font-normal">(Optional — defaults to today)</span>
            </label>
            <input
              type="date"
              name="joining_date"
              value={formData.joining_date}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Location
            </label>
            <input
              type="text"
              name="work_location"
              value={formData.work_location}
              onChange={handleChange}
              placeholder="e.g. Kolkata, WB"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
            />
          </div>

          {personType === 'EMPLOYEE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employment Type
              </label>
              <select
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 4. Intern-Specific Details (Displayed conditionally) */}
      {personType === 'INTERN' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">4. Internship Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College / University
              </label>
              <input
                type="text"
                name="college_name"
                value={formData.college_name}
                onChange={handleChange}
                placeholder="e.g. Heritage Institute of Technology"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Course / Degree
              </label>
              <input
                type="text"
                name="course"
                value={formData.course}
                onChange={handleChange}
                placeholder="e.g. B.Tech Computer Science"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internship Domain
              </label>
              <input
                type="text"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                placeholder="e.g. Full Stack Web Development"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internship Mode
              </label>
              <select
                name="internship_mode"
                value={formData.internship_mode}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="internship_start_date"
                value={formData.internship_start_date}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Anticipated End Date
              </label>
              <input
                type="date"
                name="internship_end_date"
                value={formData.internship_end_date}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Project / Task
              </label>
              <input
                type="text"
                name="project_name"
                value={formData.project_name}
                onChange={handleChange}
                placeholder="e.g. Go_Repireo People Portal & Security Modules"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. Private Internal HR Information */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-500" />
          <div>
            <h2 className="text-base font-bold text-slate-900">5. Private Internal HR Details</h2>
            <p className="text-[11px] text-slate-500">Strictly private. Never exposed on ID QR codes or public verification pages.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Emergency Contact Name
            </label>
            <input
              type="text"
              name="emergency_contact_name"
              value={formData.emergency_contact_name}
              onChange={handleChange}
              placeholder="e.g. Rajesh Sharma (Father)"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Emergency Contact Phone
            </label>
            <input
              type="tel"
              name="emergency_contact_phone"
              value={formData.emergency_contact_phone}
              onChange={handleChange}
              placeholder="+91 98765 99887"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Admin Notes
            </label>
            <textarea
              rows={2}
              name="internal_notes"
              value={formData.internal_notes}
              onChange={handleChange}
              placeholder="Performance notes, hiring notes, or internal supervisor remarks..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Submit Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <Link
          to={isEditing ? `/people/${personId}` : '/people'}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition disabled:opacity-50"
        >
          {loading
            ? (isEditing ? 'Saving Changes...' : 'Generating ID & Saving...')
            : (isEditing ? 'Save Changes' : 'Save & Issue Person ID')}
        </button>
      </div>
    </form>
  );
}
