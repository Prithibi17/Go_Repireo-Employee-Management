import React, { useState, useEffect } from 'react';
import { OfferLetter, Person } from '@/types';
import { X, Calendar, Briefcase, Mail, Phone, MapPin, User, DollarSign, Building } from 'lucide-react';

interface OfferLetterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (offerLetter: OfferLetter) => void;
  person?: Person | null;
  existingOffer?: OfferLetter | null;
}

export function OfferLetterFormModal({
  isOpen,
  onClose,
  onSuccess,
  person,
  existingOffer,
}: OfferLetterFormModalProps) {
  const isEditing = Boolean(existingOffer);

  // Helper date formatter
  const formatDateToReadable = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const initialJoiningIso = existingOffer?.joining_date 
    ? (new Date(existingOffer.joining_date).toISOString().split('T')[0] || new Date().toISOString().split('T')[0])
    : (person?.joining_date ? new Date(person.joining_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

  const [joiningIso, setJoiningIso] = useState<string>(initialJoiningIso);
  const [durationMonths, setDurationMonths] = useState<number>(existingOffer?.duration_months || 3);

  // Compute calculated end date & duration text
  const computeEndDateAndDuration = (startIso: string, months: number) => {
    try {
      const start = new Date(startIso);
      if (isNaN(start.getTime())) {
        return {
          formattedStart: startIso,
          formattedEnd: '',
          durationText: `${months} Months`,
        };
      }
      const end = new Date(start);
      end.setMonth(end.getMonth() + months);
      end.setDate(end.getDate() - 1); // 1 day before anniversary

      const formattedStart = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      const formattedEnd = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      const durationText = `${months} Months (${formattedStart} \u2013 ${formattedEnd})`;

      return {
        formattedStart,
        formattedEnd,
        durationText,
      };
    } catch {
      return {
        formattedStart: startIso,
        formattedEnd: '',
        durationText: `${months} Months`,
      };
    }
  };

  const initialCalculated = computeEndDateAndDuration(initialJoiningIso, existingOffer?.duration_months || 3);

  const [formData, setFormData] = useState({
    recipientName: existingOffer?.recipient_name || person?.full_name || '',
    recipientEmail: existingOffer?.recipient_email || person?.email || '',
    recipientPhone: existingOffer?.recipient_phone || person?.phone || '',
    recipientLocation: existingOffer?.recipient_location || person?.work_location || 'Kolkata, West Bengal, India',
    position: existingOffer?.position || person?.designation || (person?.person_type === 'INTERN' ? 'Software Developer Intern' : 'Software Engineer'),
    department: existingOffer?.department || person?.department?.name || 'Technology',
    joiningDate: existingOffer?.joining_date || initialCalculated.formattedStart,
    duration: existingOffer?.duration || initialCalculated.durationText,
    endDate: existingOffer?.end_date || initialCalculated.formattedEnd,
    stipend: existingOffer?.stipend || 'Unpaid',
    workMode: existingOffer?.work_mode || 'Remote (with occasional team meetings)',
    reportingTo: existingOffer?.reporting_to || 'Prithibi Mandi (CTO)',
    issueDate: existingOffer?.issue_date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    signatoryName: existingOffer?.signatory_name || 'ANSH TIWARI',
    signatoryTitle: existingOffer?.signatory_title || 'FOUNDER',
    companyName: existingOffer?.company_name || 'Go_Repireo',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync when person or existingOffer changes
  useEffect(() => {
    if (existingOffer) {
      setFormData({
        recipientName: existingOffer.recipient_name,
        recipientEmail: existingOffer.recipient_email,
        recipientPhone: existingOffer.recipient_phone || '',
        recipientLocation: existingOffer.recipient_location || '',
        position: existingOffer.position,
        department: existingOffer.department || '',
        joiningDate: existingOffer.joining_date,
        duration: existingOffer.duration,
        endDate: existingOffer.end_date || '',
        stipend: existingOffer.stipend,
        workMode: existingOffer.work_mode,
        reportingTo: existingOffer.reporting_to,
        issueDate: existingOffer.issue_date,
        signatoryName: existingOffer.signatory_name,
        signatoryTitle: existingOffer.signatory_title,
        companyName: existingOffer.company_name,
      });
      setDurationMonths(existingOffer.duration_months || 3);
    } else if (person) {
      const calc = computeEndDateAndDuration(new Date().toISOString().split('T')[0], 3);
      setFormData((prev) => ({
        ...prev,
        recipientName: person.full_name,
        recipientEmail: person.email,
        recipientPhone: person.phone || '',
        recipientLocation: person.work_location || 'Kolkata, West Bengal, India',
        position: person.designation || (person.person_type === 'INTERN' ? 'Software Developer Intern' : 'Software Engineer'),
        department: person.department?.name || 'Technology',
        joiningDate: calc.formattedStart,
        duration: calc.durationText,
        endDate: calc.formattedEnd,
      }));
    }
  }, [person, existingOffer]);

  // Recalculate duration & end date when joining date picker or duration months changes
  const handleJoiningDateChange = (isoDate: string) => {
    setJoiningIso(isoDate);
    const calc = computeEndDateAndDuration(isoDate, durationMonths);
    setFormData((prev) => ({
      ...prev,
      joiningDate: calc.formattedStart,
      duration: calc.durationText,
      endDate: calc.formattedEnd,
    }));
  };

  const handleDurationMonthsChange = (months: number) => {
    setDurationMonths(months);
    const calc = computeEndDateAndDuration(joiningIso, months);
    setFormData((prev) => ({
      ...prev,
      duration: calc.durationText,
      endDate: calc.formattedEnd,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!isEditing && !person?.id) {
        throw new Error('A candidate must be selected to generate an offer letter');
      }

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
            personId: person!.id,
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Technology"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Mode *</label>
                <input
                  type="text"
                  required
                  value={formData.workMode}
                  onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                  placeholder="e.g. Remote (with occasional team meetings)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Dates & Duration Calculation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Joining Date Picker</label>
                <input
                  type="date"
                  value={joiningIso}
                  onChange={(e) => handleJoiningDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Duration (Months)</label>
                <select
                  value={durationMonths}
                  onChange={(e) => handleDurationMonthsChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value={1}>1 Month</option>
                  <option value={2}>2 Months</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
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

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Joining Date on Letter (Formatted)
                </label>
                <input
                  type="text"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  placeholder="e.g. 10 October 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Duration Line on Letter (Auto-Computed)
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g. 3 Months (10 October 2026 – 09 January 2027)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Signatory Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              Signatory & Company
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Signatory Name</label>
                <input
                  type="text"
                  value={formData.signatoryName}
                  onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
                  placeholder="e.g. ANSH TIWARI"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Signatory Title</label>
                <input
                  type="text"
                  value={formData.signatoryTitle}
                  onChange={(e) => setFormData({ ...formData, signatoryTitle: e.target.value })}
                  placeholder="e.g. FOUNDER"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Go_Repireo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition flex items-center gap-2"
            >
              {loading ? 'Generating...' : isEditing ? 'Save Changes' : 'Generate Offer Letter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
