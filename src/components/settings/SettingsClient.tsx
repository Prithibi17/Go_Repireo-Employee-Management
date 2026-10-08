import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CompanySettings, Department, ApiKey } from '@/types';
import { Building2, Save, Upload, Plus, Key, Trash2, Copy, Check, ExternalLink, Code2 } from 'lucide-react';

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

  const [localDepts, setLocalDepts] = useState<Department[]>(departments);
  useEffect(() => {
    setLocalDepts(departments);
  }, [departments]);

  const [newDeptName, setNewDeptName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // API Keys Management State
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<(ApiKey & { key_token: string }) | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const loadApiKeys = () => {
    setLoadingKeys(true);
    fetch('/api/api-keys')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.apiKeys) {
          setApiKeys(data.apiKeys);
        }
      })
      .catch((err) => console.error('Failed to load API keys', err))
      .finally(() => setLoadingKeys(false));
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (data.success && data.apiKey) {
        setNewlyCreatedKey(data.apiKey);
        setNewKeyName('');
        loadApiKeys();
      } else {
        alert(data.error || 'Failed to create API key');
      }
    } finally {
      setCreatingKey(false);
    }
  };

  const handleDeleteApiKey = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete API key "${name}"? Any external services using it will lose connection.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        loadApiKeys();
      } else {
        alert(data.error || 'Failed to delete API key');
      }
    } catch {
      alert('Network error while deleting API key');
    }
  };

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
      if (data.success && data.department) {
        setLocalDepts((prev) => [...prev, data.department]);
        setNewDeptName('');
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to add department');
      }
    } catch {
      alert('Error adding department');
    }
  };

  const handleDeleteDept = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the "${name}" department? Any staff assigned to this department will have their department cleared.`)) {
      return;
    }
    // Optimistically update UI immediately
    setLocalDepts((prev) => prev.filter((d) => d.id !== id));
    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to delete department');
        onRefresh?.();
      }
    } catch {
      alert('Error deleting department');
      onRefresh?.();
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
          {localDepts.map((d) => (
            <div
              key={d.id}
              className="group p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors shadow-2xs"
            >
              <span className="truncate pr-1" title={d.name}>{d.name}</span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleDeleteDept(d.id, d.name)}
                  className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors opacity-70 group-hover:opacity-100 flex-shrink-0"
                  title={`Delete ${d.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. API Keys & Integrations */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">5. API Keys & External Integrations</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Create and manage API keys for connecting external websites, portals, or mobile apps to Go_Repireo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/api-docs"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              <Code2 className="w-3.5 h-3.5" />
              API Docs Hub
            </Link>
            {canEdit && (
              <button
                onClick={() => {
                  setNewlyCreatedKey(null);
                  setShowCreateKeyModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Create API Key
              </button>
            )}
          </div>
        </div>

        {/* Existing API Keys Table */}
        {loadingKeys ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading API keys...</div>
        ) : apiKeys.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg">
            <Key className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">No active API keys created yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Public verification endpoints are open, but you can create dedicated keys to track and authenticate client applications.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {apiKeys.map((k) => (
              <div key={k.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">{k.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-mono">
                    <span>Key Prefix: {k.key_prefix}</span>
                    <span>•</span>
                    <span className="font-sans">Created {new Date(k.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {canEdit && (
                  <button
                    onClick={() => handleDeleteApiKey(k.id, k.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                    title="Delete API Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Create API Key */}
      {showCreateKeyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {newlyCreatedKey ? 'API Key Generated' : 'Create New API Key'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateKeyModal(false);
                  setNewlyCreatedKey(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {newlyCreatedKey ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <strong>⚠️ Copy your key now:</strong> For security, this full token will only be shown once.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Generated API Token</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={newlyCreatedKey.key_token}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 select-all"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newlyCreatedKey.key_token);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setShowCreateKeyModal(false);
                      setNewlyCreatedKey(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateApiKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Application / Service Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Company Website / gorepireo.in"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Identify which service or client website will be using this key.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateKeyModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingKey}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs"
                  >
                    {creatingKey ? 'Generating...' : 'Generate API Key'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
