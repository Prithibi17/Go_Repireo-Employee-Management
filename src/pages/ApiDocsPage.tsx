import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  Code2, Key, Copy, Check, Terminal, 
  Play, Trash2, Plus, ArrowUpRight
} from 'lucide-react';
import { ApiKey } from '@/types';

export function ApiDocsPage() {
  const { user } = useAuth();

  if (user && user.role !== 'OWNER') {
    return <Navigate to="/dashboard" replace />;
  }

  const [activeTab, setActiveTab] = useState<'endpoints' | 'keys' | 'console'>('endpoints');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Active code snippet tabs per endpoint
  const [activeCodeSnippet, setActiveCodeSnippet] = useState<Record<string, 'curl' | 'js' | 'response'>>({
    cardMeta: 'curl',
    cardQr: 'html',
    cardEmbed: 'iframe',
  });

  // API Console State
  const [testId, setTestId] = useState('GRI-6Q5PVVA');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testStatus, setTestStatus] = useState<number | null>(null);
  const [consoleView, setConsoleView] = useState<'json' | 'preview'>('json');

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
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
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
      setTestResult({ success: false, error: err.message || 'Network request failed' });
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
    if (!confirm(`Revoke API key "${name}"? External clients using this token will be disconnected.`)) return;
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) loadApiKeys();
    } catch {
      alert('Failed to delete key');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-zinc-900">
      {/* Header */}
      <div className="pb-5 border-b border-zinc-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                Developer Documentation
              </span>
              <span className="text-zinc-300">•</span>
              <span className="text-[11px] font-mono text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                v1.0 REST
              </span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              API & Endpoints
            </h1>
            <p className="text-[13px] text-zinc-500 mt-1 max-w-2xl">
              HTTP endpoints for retrieving personnel verification data, raw QR streams, and embeddable ID card components.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs font-mono shrink-0">
            <span className="text-zinc-500 select-none">Base URL</span>
            <span className="text-zinc-200 select-all font-medium">{baseUrl}</span>
            <button
              onClick={() => copyToClipboard(baseUrl, 'baseurl')}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition"
              title="Copy Base URL"
            >
              {copiedKey === 'baseurl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 mt-6 border-b border-zinc-200 -mb-5 text-[13px]">
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`pb-2.5 font-medium border-b-2 transition ${
              activeTab === 'endpoints'
                ? 'border-zinc-900 text-zinc-900 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Endpoints
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`pb-2.5 font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'keys'
                ? 'border-zinc-900 text-zinc-900 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span>API Keys</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {apiKeys.length}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab('console');
              if (!testResult && !testLoading) runLiveTest();
            }}
            className={`pb-2.5 font-medium border-b-2 transition ${
              activeTab === 'console'
                ? 'border-zinc-900 text-zinc-900 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            API Console
          </button>
        </div>
      </div>

      {/* ================= TAB 1: ENDPOINTS ================= */}
      {activeTab === 'endpoints' && (
        <div className="space-y-6 pt-2">
          {/* Endpoint 1: Cards Metadata */}
          <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
            <div className="p-5 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/50">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  GET
                </span>
                <span className="font-mono text-[13px] font-semibold text-zinc-900">
                  /api/public/cards/:identifier
                </span>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                Response: application/json
              </span>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-[13px] text-zinc-600 leading-relaxed">
                Returns personnel identity records, employment details, verification status, and a pre-rendered Base64 QR code data URL. Resolves employee codes (<code className="font-mono text-xs bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200 text-zinc-800">GRE-XXXXXXX</code>), intern codes (<code className="font-mono text-xs bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200 text-zinc-800">GRI-XXXXXXX</code>), and card numbers (<code className="font-mono text-xs bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200 text-zinc-800">IDC-XXXXXXX</code>).
              </p>

              {/* Parameters Table */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2 font-mono">
                  Path Parameters
                </h4>
                <div className="border border-zinc-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 text-[11px] font-mono">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Parameter</th>
                        <th className="py-2 px-3 font-semibold">Type</th>
                        <th className="py-2 px-3 font-semibold">Required</th>
                        <th className="py-2 px-3 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-700">
                      <tr>
                        <td className="py-2.5 px-3 font-mono text-zinc-900 font-medium">identifier</td>
                        <td className="py-2.5 px-3 font-mono text-zinc-500 text-[11px]">string</td>
                        <td className="py-2.5 px-3 font-semibold text-zinc-900">Required</td>
                        <td className="py-2.5 px-3 text-zinc-600">Personnel code or card number (e.g. <code className="font-mono text-[11px]">GRI-6Q5PVVA</code>)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Code Examples */}
              <div className="rounded-lg border border-zinc-800 bg-[#0c0d0e] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveCodeSnippet((p) => ({ ...p, cardMeta: 'curl' }))}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition ${
                        activeCodeSnippet.cardMeta === 'curl'
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      cURL
                    </button>
                    <button
                      onClick={() => setActiveCodeSnippet((p) => ({ ...p, cardMeta: 'js' }))}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition ${
                        activeCodeSnippet.cardMeta === 'js'
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      JavaScript
                    </button>
                    <button
                      onClick={() => setActiveCodeSnippet((p) => ({ ...p, cardMeta: 'response' }))}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition ${
                        activeCodeSnippet.cardMeta === 'response'
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      200 OK Response
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const textToCopy =
                        activeCodeSnippet.cardMeta === 'curl'
                          ? `curl -X GET "${baseUrl}/api/public/cards/GRI-6Q5PVVA"`
                          : activeCodeSnippet.cardMeta === 'js'
                          ? `const res = await fetch('${baseUrl}/api/public/cards/GRI-6Q5PVVA');\nconst data = await res.json();\nconsole.log(data);`
                          : `{\n  "found": true,\n  "person": {\n    "person_code": "GRI-6Q5PVVA",\n    "full_name": "Aarav Sharma",\n    "department": "Technology",\n    "status": "ACTIVE"\n  }\n}`;
                      copyToClipboard(textToCopy, 'meta-code');
                    }}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition"
                    title="Copy Snippet"
                  >
                    {copiedKey === 'meta-code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="p-3 text-[12px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                  {activeCodeSnippet.cardMeta === 'curl' && (
                    <pre><code>{`curl -X GET "${baseUrl}/api/public/cards/GRI-6Q5PVVA"`}</code></pre>
                  )}
                  {activeCodeSnippet.cardMeta === 'js' && (
                    <pre><code>{`const response = await fetch('${baseUrl}/api/public/cards/GRI-6Q5PVVA');
const result = await response.json();

if (result.found) {
  console.log(result.person.full_name);
  console.log(result.card.status);
}`}</code></pre>
                  )}
                  {activeCodeSnippet.cardMeta === 'response' && (
                    <pre className="text-emerald-400"><code>{`{
  "found": true,
  "person": {
    "person_code": "GRI-6Q5PVVA",
    "full_name": "Aarav Sharma",
    "designation": "Software Engineering Intern",
    "department": "Technology",
    "person_type": "INTERN",
    "status": "ACTIVE"
  },
  "card": {
    "card_number": "IDC-7GI6M9O",
    "status": "ACTIVE",
    "issue_date": "2026-03-01",
    "valid_till": "2027-03-01",
    "qr_code_data_url": "data:image/png;base64,..."
  }
}`}</code></pre>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Endpoint 2: Direct QR Code Stream */}
          <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
            <div className="p-5 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/50">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  GET
                </span>
                <span className="font-mono text-[13px] font-semibold text-zinc-900">
                  /api/public/cards/:identifier/qr
                </span>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                Response: image/png (Binary Stream)
              </span>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-[13px] text-zinc-600 leading-relaxed">
                Directly streams raw PNG image bytes. External applications or email templates can bind the verification QR code inside a standard HTML <code className="font-mono text-xs bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200 text-zinc-800">&lt;img&gt;</code> element without client-side rendering.
              </p>

              <div className="rounded-lg border border-zinc-800 bg-[#0c0d0e] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 text-xs">
                  <span className="text-[11px] font-mono text-zinc-400 font-medium">HTML Example</span>
                  <button
                    onClick={() => copyToClipboard(`<img src="${baseUrl}/api/public/cards/GRI-6Q5PVVA/qr" width="160" height="160" alt="Identity Verification QR" />`, 'qr-html')}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition"
                  >
                    {copiedKey === 'qr-html' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-3 text-[12px] font-mono text-zinc-300 overflow-x-auto">
                  <pre><code>{`<img 
  src="${baseUrl}/api/public/cards/GRI-6Q5PVVA/qr" 
  width="160" 
  height="160" 
  alt="Verification QR" 
/>`}</code></pre>
                </div>
              </div>
            </div>
          </div>

          {/* Endpoint 3: Standalone Embed Component */}
          <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
            <div className="p-5 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/50">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-300">
                  PAGE
                </span>
                <span className="font-mono text-[13px] font-semibold text-zinc-900">
                  /embed/id-card/:identifier
                </span>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                Response: text/html (Interactive Widget)
              </span>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-[13px] text-zinc-600 leading-relaxed">
                Serves an isolated, responsive HTML widget with flip animation, verification badge, and lanyard slot for external portal embeds.
              </p>

              <div className="rounded-lg border border-zinc-800 bg-[#0c0d0e] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 text-xs">
                  <span className="text-[11px] font-mono text-zinc-400 font-medium">Embed iFrame</span>
                  <button
                    onClick={() => copyToClipboard(`<iframe src="${baseUrl}/embed/id-card/GRI-6Q5PVVA" width="380" height="660" frameborder="0" style="border:none;overflow:hidden;"></iframe>`, 'iframe-code')}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition"
                  >
                    {copiedKey === 'iframe-code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-3 text-[12px] font-mono text-zinc-300 overflow-x-auto">
                  <pre><code>{`<iframe 
  src="${baseUrl}/embed/id-card/GRI-6Q5PVVA" 
  width="380" 
  height="660" 
  style="border: none; border-radius: 12px; overflow: hidden;"
  title="Go_Repireo ID Card">
</iframe>`}</code></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: API KEYS ================= */}
      {activeTab === 'keys' && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Manage API Keys</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                API tokens authenticate client applications integrating with your personnel endpoints.
              </p>
            </div>
            <button
              onClick={() => {
                setNewlyCreatedKey(null);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create API Key
            </button>
          </div>

          {loadingKeys ? (
            <div className="py-8 text-center text-xs text-zinc-400">Loading API keys...</div>
          ) : apiKeys.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-zinc-200 rounded-lg">
              <Key className="w-5 h-5 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-zinc-700">No active API keys registered</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Generate a key to track and authenticate client services.</p>
            </div>
          ) : (
            <div className="border border-zinc-200 rounded-lg overflow-hidden divide-y divide-zinc-100">
              {apiKeys.map((k) => (
                <div key={k.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-zinc-50/50 transition">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-900 truncate">{k.name}</span>
                      <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500 font-mono">
                      <span>Prefix: {k.key_prefix}</span>
                      <span>•</span>
                      <span className="font-sans">Created {new Date(k.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteKey(k.id, k.name)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                    title="Revoke Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: API CONSOLE ================= */}
      {activeTab === 'console' && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">API Console</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Send live test requests against local and production verification endpoints.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testId}
                onChange={(e) => setTestId(e.target.value)}
                placeholder="GRI-6Q5PVVA"
                className="px-3 py-1.5 text-xs font-mono border border-zinc-300 rounded-lg text-zinc-900 w-48 focus:outline-none focus:border-zinc-500"
              />
              <button
                onClick={runLiveTest}
                disabled={testLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                {testLoading ? 'Requesting...' : 'Send'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConsoleView('json')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                    consoleView === 'json' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Response JSON
                </button>
                <button
                  onClick={() => setConsoleView('preview')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                    consoleView === 'preview' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  Live Widget Preview
                </button>
              </div>

              {testStatus && (
                <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                  testStatus === 200 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  HTTP {testStatus}
                </span>
              )}
            </div>

            {consoleView === 'json' ? (
              <div className="rounded-lg border border-zinc-800 bg-[#0c0d0e] p-4 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96">
                {testLoading ? (
                  <div className="text-zinc-500">Executing request...</div>
                ) : testResult ? (
                  <pre>{JSON.stringify(testResult, null, 2)}</pre>
                ) : (
                  <div className="text-zinc-500">Click &quot;Send&quot; to execute live query.</div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-zinc-100 rounded-lg border border-zinc-200 flex justify-center">
                <iframe
                  src={`/embed/id-card/${encodeURIComponent(testId.trim())}`}
                  width="360"
                  height="620"
                  className="rounded-xl shadow-md border border-zinc-300 bg-white"
                  title="Card Preview"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create API Key */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-semibold text-zinc-900">
                {newlyCreatedKey ? 'API Key Generated' : 'Create API Key'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewlyCreatedKey(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {newlyCreatedKey ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <strong>Notice:</strong> Copy your key token now. For security reasons, the raw token will not be displayed again.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Key Token</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={newlyCreatedKey.key_token}
                      className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-900 select-all"
                    />
                    <button
                      onClick={() => copyToClipboard(newlyCreatedKey.key_token || '', 'modal-token')}
                      className="px-3 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0"
                    >
                      {copiedKey === 'modal-token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'modal-token' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewlyCreatedKey(null);
                    }}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Application / Client Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Website Integration, Mobile Portal"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-500"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Name to identify which service uses this token.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 border border-zinc-300 text-zinc-700 text-xs font-medium rounded-lg hover:bg-zinc-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingKey}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {creatingKey ? 'Generating...' : 'Create Key'}
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
