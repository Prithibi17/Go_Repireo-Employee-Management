import React, { useState } from 'react';
import { CompanySettings, Department } from '@/types';
import { Building2, Save, Upload, Plus } from 'lucide-react';

interface SettingsClientProps {
  settings: CompanySettings;
  departments: Department[];
  canEdit: boolean;
  onRefresh?: () => void;
}

export function SettingsClient({ settings, departments, canEdit, onRefresh }: SettingsClientProps) {
  const [formData, setFormData] = useState({
    company_name: settings.company_name,
    legal_name: settings.legal_name || '',
    tagline: settings.tagline,
    website: settings.website,
    support_email: settings.support_email,
    support_phone: settings.support_phone || '',
    address: settings.address || '',
    id_default_validity_days: settings.id_default_validity_days || 365,
    signatory_name: settings.signatory_name || '',
    signatory_designation: settings.signatory_designation || '',
    certificate_heading: settings.certificate_heading,
    certificate_body_template: settings.certificate_body_template,
  });

  const [newDeptName, setNewDeptName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to save settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddDept = async () => {
    if (!newDeptName.trim()) return;
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeptName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewDeptName('');
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to add department');
      }
    } catch {
      alert('Error adding department');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Company Settings & Templates
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure official company details, signatory names, ID card rules, and departments.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-800">
          ✓ Company configuration successfully updated.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* 1. Company Profile */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">1. Company Profile</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                name="company_name"
                disabled={!canEdit}
                value={formData.company_name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                name="tagline"
                disabled={!canEdit}
                value={formData.tagline}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Website</label>
              <input
                type="text"
                name="website"
                disabled={!canEdit}
                value={formData.website}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Support Email</label>
              <input
                type="email"
                name="support_email"
                disabled={!canEdit}
                value={formData.support_email}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Office Address</label>
              <input
                type="text"
                name="address"
                disabled={!canEdit}
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* 2. Authorized Signatory & Certificate Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">2. Authorized Signatory & Certificate Template</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Authorized Signatory Name</label>
              <input
                type="text"
                name="signatory_name"
                disabled={!canEdit}
                value={formData.signatory_name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Signatory Designation</label>
              <input
                type="text"
                name="signatory_designation"
                disabled={!canEdit}
                value={formData.signatory_designation}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Certificate Heading</label>
              <input
                type="text"
                name="certificate_heading"
                disabled={!canEdit}
                value={formData.certificate_heading}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Certificate Body Paragraph</label>
              <textarea
                rows={3}
                name="certificate_body_template"
                disabled={!canEdit}
                value={formData.certificate_body_template}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* 3. ID Card Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">3. ID Card Validity</h2>
          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Default Validity (Days)</label>
            <input
              type="number"
              name="id_default_validity_days"
              disabled={!canEdit}
              value={formData.id_default_validity_days}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900"
            />
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </form>

      {/* 4. Departments Management */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">4. Configured Departments</h2>
        <p className="text-xs text-slate-500">
          Admins can add company departments. Historical departments remain linked to preserve document integrity.
        </p>

        {canEdit && (
          <div className="flex gap-2 pt-2">
            <input
              type="text"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="e.g. Artificial Intelligence"
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900 max-w-sm flex-1"
            />
            <button
              onClick={handleAddDept}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Department
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
          {departments.map((d) => (
            <div
              key={d.id}
              className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs font-semibold text-slate-800 flex items-center justify-between"
            >
              <span>{d.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
