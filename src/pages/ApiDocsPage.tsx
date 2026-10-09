import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  Code2, Key, Copy, Check, ExternalLink, Terminal, 
  Sparkles, Layers, QrCode, Play, Eye, Trash2, Plus
} from 'lucide-react';
import { ApiKey } from '@/types';

export function ApiDocsPage() {
  const { user } = useAuth();

  if (user && user.role !== 'OWNER') {
    return <Navigate to="/dashboard" replace />;
  }

  const [activeTab, setActiveTab] = useState<'endpoints' | 'tester' | 'keys'>('endpoints');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Live Tester State
  const [testId, setTestId] = useState('GRI-6Q5PVVA');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testStatus, setTestStatus] = useState<number | null>(null);
  const [previewTab, setPreviewTab] = useState<'json' | 'qr' | 'embed'>('json');

  // API Keys State
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<(ApiKey & { key_token: string }) | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://go-repireo-employee-management.vercel.app';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const runLiveTest = async () => {
    if (!testId.trim()) return;
    setTestLoading(true);
    setTestResult(null);
    setTestStatus(null);
    try {
      const res = await fetch(`/api/public/cards/${encodeURIComponent(testId.trim())}`);
      setTestStatus(res.status);
      const json = await res.json();
      setTestResult(json);
    } catch (err: any) {
      setTestStatus(500);
      setTestResult({ success: false, error: err.message || 'Failed to fetch' });
    } finally {
      setTestLoading(false);
    }
  };

  const loadApiKeys = () => {
    setLoadingKeys(true);
    fetch('/api/api-keys')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.apiKeys) setApiKeys(data.apiKeys);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoadingKeys(false));
  };

  useEffect(() => {
    loadApiKeys();
    // Run an initial sample test
    runLiveTest();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
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
        alert(data.error || 'Failed to create key');
      }
    } finally {
      setCreatingKey(false);
    }
  };

  const handleDeleteKey = async (id: string, name: string) => {
    if (!confirm(`Delete API key "${name}"?`)) return;
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) loadApiKeys();
    } catch {
      alert('Failed to delete key');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Code2 className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                API & Endpoints Hub
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                CORS Enabled (*)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Connect external Go_Repireo websites (e.g. gorepireo.in, client portals, mobile apps) directly to this management backend to retrieve staff identities, departments, statuses, live verification QR codes, and embeddable ID card widgets.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono">
            <span className="text-slate-400 select-none">Base URL:</span>
            <span className="font-semibold text-slate-800">{baseUrl}</span>
            <button
              onClick={() => copyToClipboard(baseUrl, 'baseurl')}
              className="p-1 hover:bg-slate-200 rounded text-slate-600 transition"
              title="Copy Base URL"
            >
              {copiedText === 'baseurl' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 mt-6 -mb-6">
          {[
            { id: 'endpoints', label: 'Endpoints Reference', icon: Layers },
            { id: 'tester', label: 'Interactive Live Tester', icon: Play },
            { id: 'keys', label: `API Keys (${apiKeys.length})`, icon: Key },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 pb-3 px-3 text-xs font-semibold border-b-2 transition ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= TAB 1: ENDPOINTS REFERENCE ================= */}
      {activeTab === 'endpoints' && (
        <div className="space-y-6">
          {/* Endpoint 1: JSON API */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-blue-600 text-white font-mono text-xs font-bold">GET</span>
                <code className="text-sm font-bold font-mono text-slate-900">/api/public/cards/:identifier</code>
              </div>
              <span className="text-xs text-slate-500">Format: JSON • Cross-Origin Supported</span>
            </div>
            <p className="text-xs text-slate-600">
              Retrieves complete personnel metadata, employment status, designation, department, and a pre-rendered Base64 PNG QR code data URL. Seamlessly resolves both employee codes (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">GRE-XXXXXXX</code>), intern codes (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">GRI-XXXXXXX</code>), and automatically handles promoted personnel backward-compatibly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Request Example (JavaScript)</h4>
                <div className="relative bg-slate-900 rounded-lg p-3 text-slate-200 text-xs font-mono overflow-x-auto">
                  <button
                    onClick={() => copyToClipboard(`const res = await fetch('${baseUrl}/api/public/cards/GRI-6Q5PVVA');\nconst data = await res.json();\nconsole.log(data.person.full_name, data.card.status);`, 'js-fetch')}
                    className="absolute top-2 right-2 p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                    title="Copy Code"
                  >
                    {copiedText === 'js-fetch' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <pre>{`const res = await fetch('${baseUrl}/api/public/cards/GRI-6Q5PVVA');
const data = await res.json();

if (data.found) {
  // Directly bind the pre-rendered QR code
  img.src = data.card.qr_code_data_url;
  nameEl.textContent = data.person.full_name;
  deptEl.textContent = data.person.department;
}`}</pre>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">cURL CLI Command</h4>
                <div className="relative bg-slate-900 rounded-lg p-3 text-slate-200 text-xs font-mono overflow-x-auto">
                  <button
                    onClick={() => copyToClipboard(`curl "${baseUrl}/api/public/cards/GRI-6Q5PVVA"`, 'curl-1')}
                    className="absolute top-2 right-2 p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                    title="Copy cURL"
                  >
                    {copiedText === 'curl-1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <pre>{`curl "${baseUrl}/api/public/cards/GRI-6Q5PVVA"`}</pre>
                </div>
              </div>
            </div>
          </div>

          {/* Endpoint 2: Direct QR Code Image */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-blue-600 text-white font-mono text-xs font-bold">GET</span>
                <code className="text-sm font-bold font-mono text-slate-900">/api/public/cards/:identifier/qr</code>
              </div>
              <span className="text-xs text-slate-500">Format: image/png (Binary Stream)</span>
            </div>
            <p className="text-xs text-slate-600">
              Streams raw PNG image bytes directly. Allows external websites or email newsletters to display the official verification QR code with a single HTML <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">&lt;img&gt;</code> tag without any client-side JavaScript or QR libraries.
            </p>

            <div className="bg-slate-900 rounded-lg p-3 text-slate-200 text-xs font-mono relative overflow-x-auto">
              <button
                onClick={() => copyToClipboard(`<img src="${baseUrl}/api/public/cards/GRI-6Q5PVVA/qr" width="180" height="180" alt="Go_Repireo ID Verification QR Code" />`, 'html-img')}
                className="absolute top-2 right-2 p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
              >
                {copiedText === 'html-img' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre>{`<!-- Drop anywhere in your HTML or Markdown -->
<img 
  src="${baseUrl}/api/public/cards/GRI-6Q5PVVA/qr" 
  width="180" 
  height="180" 
  alt="Go_Repireo Verification QR" 
/>`}</pre>
            </div>
          </div>

          {/* Endpoint 3: Standalone Embed Widget */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-emerald-600 text-white font-mono text-xs font-bold">PAGE</span>
                <code className="text-sm font-bold font-mono text-slate-900">/embed/id-card/:identifier</code>
              </div>
              <span className="text-xs text-slate-500">Format: Standalone Interactive HTML</span>
            </div>
            <p className="text-xs text-slate-600">
              A responsive, standalone embeddable widget rendering the official Go_Repireo ID Card with front/back flip animation, lanyard slot, and scannable verification code. Ideal for client portals and intra-company profiles.
            </p>

            <div className="bg-slate-900 rounded-lg p-3 text-slate-200 text-xs font-mono relative overflow-x-auto">
              <button
                onClick={() => copyToClipboard(`<iframe src="${baseUrl}/embed/id-card/GRI-6Q5PVVA" width="420" height="720" style="border:none;border-radius:16px;overflow:hidden;" title="Go_Repireo ID Card"></iframe>`, 'iframe-code')}
                className="absolute top-2 right-2 p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
              >
                {copiedText === 'iframe-code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre>{`<iframe 
  src="${baseUrl}/embed/id-card/GRI-6Q5PVVA" 
  width="420" 
  height="720" 
  style="border: none; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);" 
  title="Go_Repireo ID Card">
</iframe>`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: INTERACTIVE LIVE TESTER ================= */}
      {activeTab === 'tester' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Live API Request Console</h3>
                <p className="text-xs text-slate-500">
                  Enter any Staff ID (e.g. <span className="font-mono font-semibold">GRI-6Q5PVVA</span>, <span className="font-mono font-semibold">GRE-6Q5PVVA</span>), Card Number (<span className="font-mono font-semibold">IDC-7GI6M9O</span>), or Verification Code.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={testId}
                  onChange={(e) => setTestId(e.target.value)}
                  placeholder="GRI-6Q5PVVA"
                  className="px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg text-slate-900 w-44"
                />
                <button
                  onClick={runLiveTest}
                  disabled={testLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  {testLoading ? 'Fetching...' : 'Send Request'}
                </button>
              </div>
            </div>

            {/* Results Preview Switcher */}
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  {[
                    { id: 'json', label: 'JSON Data' },
                    { id: 'qr', label: 'QR Image Stream' },
                    { id: 'embed', label: 'Interactive Embed' },
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      onClick={() => setPreviewTab(subTab.id as any)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                        previewTab === subTab.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>

                {testStatus && (
                  <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                    testStatus === 200 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    HTTP {testStatus}
                  </span>
                )}
              </div>

              {/* Subtab 1: JSON */}
              {previewTab === 'json' && (
                <div className="bg-slate-900 rounded-xl p-4 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96">
                  {testLoading ? (
                    <div className="text-slate-400">Loading response...</div>
                  ) : testResult ? (
                    <pre>{JSON.stringify(testResult, null, 2)}</pre>
                  ) : (
                    <div className="text-slate-500">No request sent yet. Click "Send Request" to test.</div>
                  )}
                </div>
              )}

              {/* Subtab 2: QR Stream */}
              {previewTab === 'qr' && (
                <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-3">
                  <img
                    src={`/api/public/cards/${encodeURIComponent(testId.trim())}/qr`}
                    alt="Live QR code"
                    className="w-48 h-48 bg-white p-2 rounded-xl shadow-md border border-slate-200 object-contain"
                  />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-800">Direct Binary Endpoint</p>
                    <code className="text-[11px] text-slate-500 font-mono">
                      {baseUrl}/api/public/cards/{testId}/qr
                    </code>
                  </div>
                </div>
              )}

              {/* Subtab 3: Embed Iframe */}
              {previewTab === 'embed' && (
                <div className="p-6 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                  <iframe
                    src={`/embed/id-card/${encodeURIComponent(testId.trim())}`}
                    width="360"
                    height="620"
                    className="rounded-xl shadow-lg border border-slate-300 bg-white"
                    title="Live Card Embed"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: API KEYS ================= */}
      {activeTab === 'keys' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Manage API Keys</h3>
              <p className="text-xs text-slate-500">
                Generate and revoke client credentials for secure integration with third-party web apps and backend services.
              </p>
            </div>
            <button
              onClick={() => {
                setNewlyCreatedKey(null);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Create API Key
            </button>
          </div>

          {loadingKeys ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading API keys...</div>
          ) : apiKeys.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg">
              <Key className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No API keys registered</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click "Create API Key" to provision a new client key.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {apiKeys.map((k) => (
                <div key={k.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{k.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-mono">
                      <span>Prefix: {k.key_prefix}</span>
                      <span>•</span>
                      <span className="font-sans">Created {new Date(k.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteKey(k.id, k.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                    title="Delete API Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Key in Docs page */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {newlyCreatedKey ? 'API Key Generated' : 'Create New API Key'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
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
                      onClick={() => copyToClipboard(newlyCreatedKey.key_token || '', 'modal-token')}
                      className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0"
                    >
                      {copiedText === 'modal-token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedText === 'modal-token' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewlyCreatedKey(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
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
                    onClick={() => setShowCreateModal(false)}
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
