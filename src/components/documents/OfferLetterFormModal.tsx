import React, { useState, useEffect } from 'react';
import { OfferLetter, Person } from '@/types';
import { X, Calendar, Briefcase, User, Sparkles } from 'lucide-react';

interface OfferLetterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (offerLetter: OfferLetter) => void;
  person?: Person | null;
  existingOffer?: OfferLetter | null;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Pure calendar arithmetic to compute human-friendly offer dates & duration lines.
 * Free from timezone shifts.
 */
function computeOfferDatesAndDuration(startIso: string, months: number) {
  if (!startIso) {
    const monthLabel = months === 1 ? '1 Month' : `${months} Months`;
    return {
      formattedStart: '',
      formattedEnd: '',
      durationLine: monthLabel,
    };
  }

  const parts = startIso.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1; // 0-indexed month
  const d = parseInt(parts[2], 10);

  if (isNaN(y) || isNaN(m) || isNaN(d) || m < 0 || m > 11) {
    const monthLabel = months === 1 ? '1 Month' : `${months} Months`;
    return {
      formattedStart: startIso,
      formattedEnd: '',
      durationLine: monthLabel,
    };
  }

  const formattedStart = `${d} ${MONTH_NAMES[m]} ${y}`;

  // End date is exactly `months` later minus 1 day
  const endDateObj = new Date(y, m + months, d - 1);
  const endD = endDateObj.getDate();
  const endM = endDateObj.getMonth();
  const endY = endDateObj.getFullYear();
  const formattedEnd = `${endD} ${MONTH_NAMES[endM]} ${endY}`;

  const monthLabel = months === 1 ? '1 Month' : `${months} Months`;
  const durationLine = `${monthLabel} (${formattedStart} \u2013 ${formattedEnd})`;

  return {
    formattedStart,
    formattedEnd,
    durationLine,
  };
}

/**
 * Get current local date as YYYY-MM-DD
 */
function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function OfferLetterFormModal({
  isOpen,
  onClose,
  onSuccess,
  person,
  existingOffer,
}: OfferLetterFormModalProps) {
  const isEditing = Boolean(existingOffer);

  // Departments list state
  const [departments, setDepartments] = useState<string[]>([
    'Technology',
    'IT',
    'Marketing',
    'Management',
    'Operations',
    'Design',
    'Sales',
    'Human Resources',
    'Finance',
  ]);

  // Fetch departments from database on mount
  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.departments)) {
          const names = data.departments.map((d: any) => d.name).filter(Boolean);
          setDepartments((prev) => Array.from(new Set([...names, ...prev])));
        }
      })
      .catch(() => {});
  }, []);

  // Determine initial date
  const parseIsoFromDate = (dateVal?: string | null): string => {
    if (!dateVal) return getLocalTodayIso();
    // If it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
    try {
      const parsed = new Date(dateVal);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch {}
    return getLocalTodayIso();
  };

  const initialJoiningIso = existingOffer?.joining_date
    ? parseIsoFromDate(existingOffer.joining_date)
    : parseIsoFromDate(person?.joining_date);

  const [joiningIso, setJoiningIso] = useState<string>(initialJoiningIso);
  const [durationMonths, setDurationMonths] = useState<number>(existingOffer?.duration_months || 3);

  const initialCalc = computeOfferDatesAndDuration(initialJoiningIso, existingOffer?.duration_months || 3);

  const [formData, setFormData] = useState({
    recipientName: existingOffer?.recipient_name || person?.full_name || '',
    recipientEmail: existingOffer?.recipient_email || person?.email || '',
    recipientPhone: existingOffer?.recipient_phone || person?.phone || '',
    recipientLocation: existingOffer?.recipient_location || person?.work_location || 'Kolkata, West Bengal, India',
    position: existingOffer?.position || person?.designation || (person?.person_type === 'INTERN' ? 'Software Developer Intern' : 'Software Engineer'),
    department: existingOffer?.department || person?.department?.name || 'Technology',
    joiningDate: existingOffer?.joining_date || initialCalc.formattedStart,
    duration: existingOffer?.duration || initialCalc.durationLine,
    endDate: existingOffer?.end_date || initialCalc.formattedEnd,
    stipend: existingOffer?.stipend || 'Unpaid',
    workMode: existingOffer?.work_mode || 'Remote',
    reportingTo: existingOffer?.reporting_to || 'Prithibi Mandi (CTO)',
    issueDate: existingOffer?.issue_date || initialCalc.formattedStart,
    signatoryName: existingOffer?.signatory_name || 'ANSH TIWARI',
    signatoryTitle: existingOffer?.signatory_title || 'FOUNDER',
    companyName: existingOffer?.company_name || 'Go_Repireo',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if existingOffer or person prop changes
  useEffect(() => {
    if (existingOffer) {
      const parsedIso = parseIsoFromDate(existingOffer.joining_date);
      setJoiningIso(parsedIso);
      setDurationMonths(existingOffer.duration_months || 3);
      setFormData({
        recipientName: existingOffer.recipient_name,
        recipientEmail: existingOffer.recipient_email,
        recipientPhone: existingOffer.recipient_phone || '',
        recipientLocation: existingOffer.recipient_location || '',
        position: existingOffer.position,
        department: existingOffer.department || 'Technology',
        joiningDate: existingOffer.joining_date,
        duration: existingOffer.duration,
        endDate: existingOffer.end_date || '',
        stipend: existingOffer.stipend,
        workMode: existingOffer.work_mode || 'Remote',
        reportingTo: existingOffer.reporting_to,
        issueDate: existingOffer.issue_date,
        signatoryName: existingOffer.signatory_name,
        signatoryTitle: existingOffer.signatory_title,
        companyName: existingOffer.company_name,
      });
    } else if (person) {
      const personIso = parseIsoFromDate(person.joining_date);
      setJoiningIso(personIso);
      const calc = computeOfferDatesAndDuration(personIso, 3);
      setFormData((prev) => ({
        ...prev,
        recipientName: person.full_name,
        recipientEmail: person.email,
        recipientPhone: person.phone || '',
        recipientLocation: person.work_location || 'Kolkata, West Bengal, India',
        position: person.designation || (person.person_type === 'INTERN' ? 'Software Developer Intern' : 'Software Engineer'),
        department: person.department?.name || 'Technology',
        joiningDate: calc.formattedStart,
        duration: calc.durationLine,
        endDate: calc.formattedEnd,
      }));
    }
  }, [person, existingOffer]);

  // Recalculate duration & formatted dates whenever Joining Date Picker changes
  const handleJoiningDateChange = (isoDate: string) => {
    setJoiningIso(isoDate);
    const calc = computeOfferDatesAndDuration(isoDate, durationMonths);
    setFormData((prev) => ({
      ...prev,
      joiningDate: calc.formattedStart,
      duration: calc.durationLine,
      endDate: calc.formattedEnd,
    }));
  };

  // Recalculate duration whenever Duration (Months) changes
  const handleDurationMonthsChange = (months: number) => {
    setDurationMonths(months);
    const calc = computeOfferDatesAndDuration(joiningIso, months);
    setFormData((prev) => ({
      ...prev,
      duration: calc.durationLine,
      endDate: calc.formattedEnd,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isEditing ? `/api/offer-letters/${existingOffer?.id}` : '/api/offer-letters';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = isEditing
        ? {
            recipient_name: formData.recipientName,
            recipient_email: formData.recipientEmail,
            recipient_phone: formData.recipientPhone,
            recipient_location: formData.recipientLocation,
            position: formData.position,
            department: formData.department,
            duration: formData.duration,
            duration_months: durationMonths,
            stipend: formData.stipend,
            work_mode: formData.workMode,
            reporting_to: formData.reportingTo,
            joining_date: formData.joiningDate,
            end_date: formData.endDate,
            issue_date: formData.issueDate,
            signatory_name: formData.signatoryName,
            signatory_title: formData.signatoryTitle,
            company_name: formData.companyName,
          }
        : {
            personId: person?.id || null,
            recipientName: formData.recipientName,
            recipientEmail: formData.recipientEmail,
            recipientPhone: formData.recipientPhone,
            recipientLocation: formData.recipientLocation,
            position: formData.position,
            department: formData.department,
            duration: formData.duration,
            durationMonths,
            stipend: formData.stipend,
            workMode: formData.workMode,
            reportingTo: formData.reportingTo,
            joiningDate: formData.joiningDate,
            endDate: formData.endDate,
            issueDate: formData.issueDate,
            signatoryName: formData.signatoryName,
            signatoryTitle: formData.signatoryTitle,
            companyName: formData.companyName,
          };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save offer letter');
      }

      onSuccess(data.offerLetter);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {isEditing ? 'Edit Offer Letter' : 'Generate Official Offer Letter'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Vector PDF overlay with high-resolution typography matching official Go_Repireo format
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Candidate Info Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              Candidate & Recipient Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Candidate Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder="e.g. Samyak Singh"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.recipientEmail}
                  onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                  placeholder="e.g. candidate@gmail.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.recipientPhone}
                  onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location / Address</label>
                <input
                  type="text"
                  value={formData.recipientLocation}
                  onChange={(e) => setFormData({ ...formData, recipientLocation: e.target.value })}
                  placeholder="e.g. Kolkata, West Bengal, India"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Role & Key Offer Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              Role & Offer Terms
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Position / Job Title *</label>
                <input
                  type="text"
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g. Software Developer Intern"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Department Dropdown */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  {/* Ensure current value is included if not in default list */}
                  {formData.department && !departments.includes(formData.department) && (
                    <option value={formData.department}>{formData.department}</option>
                  )}
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stipend / Compensation *</label>
                <input
                  type="text"
                  required
                  value={formData.stipend}
                  onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                  placeholder="e.g. Unpaid or ₹10,000 / month"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Work Mode Dropdown */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Mode *</label>
                <select
                  required
                  value={formData.workMode}
                  onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote (with occasional team meetings)">
                    Remote (with occasional team meetings)
                  </option>
                  {/* Keep existing custom value if editing */}
                  {formData.workMode &&
                    !['Remote', 'On-site', 'Hybrid', 'Remote (with occasional team meetings)'].includes(formData.workMode) && (
                      <option value={formData.workMode}>{formData.workMode}</option>
                    )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reporting To *</label>
                <input
                  type="text"
                  required
                  value={formData.reportingTo}
                  onChange={(e) => setFormData({ ...formData, reportingTo: e.target.value })}
                  placeholder="e.g. Prithibi Mandi (CTO)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Dates & Auto-Calculation */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Dates & Duration Calculation
              </h3>
              <span className="text-[11px] text-indigo-600 flex items-center gap-1 font-medium bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                <Sparkles className="w-3 h-3" /> Auto-synced
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Joining Date Picker</label>
                <input
                  type="date"
                  value={joiningIso}
                  onChange={(e) => handleJoiningDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Duration (Months)</label>
                <select
                  value={durationMonths}
                  onChange={(e) => handleDurationMonthsChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                >
                  <option value={1}>1 Month</option>
                  <option value={2}>2 Months</option>
                  <option value={3}>3 Months</option>
                  <option value={4}>4 Months</option>
                  <option value={5}>5 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={9}>9 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issue Date</label>
                <input
                  type="text"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  placeholder="e.g. 10 October 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                />
              </div>
            </div>

            <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    Joining Date on Letter (Formatted)
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                    Auto-filled
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  placeholder="e.g. 10 October 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono text-xs text-slate-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    Duration Line on Letter (Auto-Computed)
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200">
                    Auto-computed
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g. 3 Months (10 October 2026 – 9 January 2027)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              {loading ? 'Generating...' : isEditing ? 'Save Changes' : 'Generate Offer Letter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
