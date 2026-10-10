import React, { useState, useEffect } from 'react';
import { EmployeeAgreement, Person } from '@/types';
import { X, Calendar, User, MapPin, Mail, Phone } from 'lucide-react';

interface EmployeeAgreementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (agreement: EmployeeAgreement) => void;
  person?: Person | null;
  existingAgreement?: EmployeeAgreement | null;
}

export function EmployeeAgreementFormModal({
  isOpen,
  onClose,
  onSuccess,
  person,
  existingAgreement,
}: EmployeeAgreementFormModalProps) {
  const isEditing = Boolean(existingAgreement);

  // Available people for quick-pick
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    person?.id || existingAgreement?.person_id || ''
  );

  const getTodayFormatted = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [formData, setFormData] = useState({
    recipientTitle: existingAgreement?.recipient_title || 'Mr.',
    recipientName: existingAgreement?.recipient_name || person?.full_name || '',
    recipientAddress: existingAgreement?.recipient_address || person?.address_line || '',
    recipientEmail: existingAgreement?.recipient_email || person?.personal_email || person?.company_email || '',
    recipientPhone: existingAgreement?.recipient_phone || person?.phone || '',
    salutationName: existingAgreement?.salutation_name || person?.full_name?.split(' ')[0] || '',
    issueDate: existingAgreement?.issue_date || getTodayFormatted(),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch people list for optional quick autofill
  useEffect(() => {
    if (isOpen) {
      fetch('/api/people')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setPeople(data.people || []);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Sync when person or existingAgreement changes
  useEffect(() => {
    if (existingAgreement) {
      setFormData({
        recipientTitle: existingAgreement.recipient_title || 'Mr.',
        recipientName: existingAgreement.recipient_name,
        recipientAddress: existingAgreement.recipient_address,
        recipientEmail: existingAgreement.recipient_email || '',
        recipientPhone: existingAgreement.recipient_phone || '',
        salutationName: existingAgreement.salutation_name,
        issueDate: existingAgreement.issue_date,
      });
      setSelectedPersonId(existingAgreement.person_id || '');
    } else if (person) {
      const fullAddress = [
        person.address_line,
        person.city,
        person.state ? `${person.state} ${person.postal_code || ''}`.trim() : person.postal_code,
      ]
        .filter(Boolean)
        .join(', ');

      setFormData({
        recipientTitle: person.gender === 'FEMALE' ? 'Ms.' : 'Mr.',
        recipientName: person.full_name,
        recipientAddress: fullAddress || person.work_location || '',
        recipientEmail: person.personal_email || person.company_email || '',
        recipientPhone: person.phone || '',
        salutationName: person.full_name.split(' ')[0],
        issueDate: getTodayFormatted(),
      });
      setSelectedPersonId(person.id);
    }
  }, [person, existingAgreement, isOpen]);

  // Handle changing person from dropdown
  const handlePersonSelect = (pId: string) => {
    setSelectedPersonId(pId);
    if (!pId) return;
    const selected = people.find((p) => p.id === pId);
    if (selected) {
      const fullAddress = [
        selected.address_line,
        selected.city,
        selected.state ? `${selected.state} ${selected.postal_code || ''}`.trim() : selected.postal_code,
      ]
        .filter(Boolean)
        .join(', ');

      setFormData((prev) => ({
        ...prev,
        recipientTitle: selected.gender === 'FEMALE' ? 'Ms.' : 'Mr.',
        recipientName: selected.full_name,
        recipientAddress: fullAddress || selected.work_location || prev.recipientAddress,
        recipientEmail: selected.personal_email || selected.company_email || prev.recipientEmail,
        recipientPhone: selected.phone || prev.recipientPhone,
        salutationName: selected.full_name.split(' ')[0] || prev.salutationName,
      }));
    }
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      recipientName: name,
      // Auto-update salutation if empty or matching first name
      salutationName: prev.salutationName === prev.recipientName.split(' ')[0] || !prev.salutationName
        ? name.split(' ')[0]
        : prev.salutationName,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isEditing ? `/api/employee-agreements/${existingAgreement?.id}` : '/api/employee-agreements';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = isEditing
        ? {
            recipient_title: formData.recipientTitle,
            recipient_name: formData.recipientName,
            recipient_address: formData.recipientAddress,
            recipient_email: formData.recipientEmail,
            recipient_phone: formData.recipientPhone,
            salutation_name: formData.salutationName,
            issue_date: formData.issueDate,
          }
        : {
            personId: selectedPersonId || null,
            recipientTitle: formData.recipientTitle,
            recipientName: formData.recipientName,
            recipientAddress: formData.recipientAddress,
            recipientEmail: formData.recipientEmail,
            recipientPhone: formData.recipientPhone,
            salutationName: formData.salutationName,
            issueDate: formData.issueDate,
          };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save employee agreement');
      }

      onSuccess(data.agreement);
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {isEditing ? 'Edit Employee Agreement' : 'Generate Employee Agreement (3 Pages)'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Official 3-page vector agreement with legal terms, clauses, and company signatures
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
          <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Optional Person Quick-Select */}
          {!isEditing && people.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Autofill from Existing Person (Optional)
              </label>
              <select
                value={selectedPersonId}
                onChange={(e) => handlePersonSelect(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Enter details manually or select person --</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.person_code}) - {p.designation}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Recipient Details (Only changeable fields) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              Recipient Information
            </h3>

            {/* Title + Name */}
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="col-span-1">
                <label className="block font-semibold text-slate-700 mb-1">Title</label>
                <select
                  value={formData.recipientTitle}
                  onChange={(e) => setFormData({ ...formData, recipientTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-serif text-sm"
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Dr.">Dr.</option>
                </select>
              </div>

              <div className="col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.recipientName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Pranshu Gur"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-serif text-sm font-bold"
                />
              </div>
            </div>

            {/* Address */}
            <div className="text-xs">
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                Address (Appears under recipient name) <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={formData.recipientAddress}
                onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                placeholder="e.g. FJQ7+9CF, Alakhnanda Colony, Aravali Vihar Colony, Ajmer, Rajasthan 305004"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-serif text-xs leading-relaxed"
              />
            </div>

            {/* Salutation Name */}
            <div className="text-xs">
              <label className="block font-semibold text-slate-700 mb-1">
                Salutation Name (Appears as &quot;Dear [Name],&quot;) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm text-slate-600 font-bold">Dear</span>
                <input
                  type="text"
                  required
                  value={formData.salutationName}
                  onChange={(e) => setFormData({ ...formData, salutationName: e.target.value })}
                  placeholder="e.g. Pranshu"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-serif text-sm font-bold"
                />
                <span className="font-serif text-sm text-slate-600 font-bold">,</span>
              </div>
            </div>

            {/* Agreement Date */}
            <div className="text-xs">
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Agreement Date <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                placeholder="e.g. 08/10/2026"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-serif text-sm font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Appears as &quot;Date:- {formData.issueDate}&quot; on Page 1 and above the intern signature on Page 3.
              </p>
            </div>

            {/* Optional Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  Candidate Email (For sending copy)
                </label>
                <input
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                  placeholder="e.g. candidate@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  Candidate Phone (Optional)
                </label>
                <input
                  type="text"
                  value={formData.recipientPhone}
                  onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                  placeholder="e.g. +91 9876543210"
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
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              {loading ? 'Generating...' : isEditing ? 'Save Changes' : 'Generate Agreement (3 Pages)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
