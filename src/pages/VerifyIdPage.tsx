import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatDate, formatDateTime } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Lock, ExternalLink, Printer } from 'lucide-react';

export function VerifyIdPage() {
  const { code } = useParams<{ code: string }>();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    fetch(`/api/verify/id/${code}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setResult(data.result);
      })
      .finally(() => setLoading(false));
  }, [code]);

  const nowFormatted = formatDateTime(new Date().toISOString());

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3 bg-white p-8 rounded-xl border border-slate-200 shadow-xs max-w-sm w-full">
          <div className="w-6 h-6 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Resolving Credential Record...</p>
          <p className="text-[11px] text-slate-400">Verifying signature against Go_Repireo central registry</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans print:bg-white print:min-h-0 print:p-0">
      {/* Official Registry Top Bar (Hidden on print) */}
      <header className="web-header bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/gorepireo-logo.png"
              alt="Go_Repireo"
              className="h-7 w-7 object-contain"
            />
            <div className="border-l border-slate-200 pl-3">
              <span className="text-xs font-bold tracking-tight text-slate-900 block leading-tight">
                Go_Repireo
              </span>
              <span className="text-[10px] text-slate-500 font-medium block leading-tight">
                Personnel & Credential Registry
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/80">
              <Lock className="w-3 h-3 text-slate-500" />
              Official Verification Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main Verification Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 sm:py-10 print:max-w-none print:w-full print:p-0 print:m-0">
        {!result || result.status === 'NOT_FOUND' ? (
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden verification-print-document">
            <div className="p-4 sm:p-5 bg-rose-50/60 border-b border-rose-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-rose-950">Credential Record Not Found</h1>
                <p className="text-xs text-rose-800/80">The provided verification reference could not be resolved.</p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-600">
              <p className="leading-relaxed">
                The identifier <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-semibold">{code}</code> is not associated with any active or archived credentials in the Go_Repireo personnel database.
              </p>
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-slate-500 space-y-1 text-[11px]">
                <p className="font-semibold text-slate-700">Possible Causes:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>The QR code or verification link is invalid or incomplete.</li>
                  <li>The card has not been officially registered or published by HR.</li>
                  <li>The credential record was permanently removed.</li>
                </ul>
              </div>
              <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100 flex justify-between">
                <span>Timestamp: {nowFormatted}</span>
                <span>Registry: ID-VERIFY-SVC</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden verification-print-document print:rounded-none">
            {/* Print-Only Official Letterhead Header */}
            <div className="hidden print:flex items-center justify-between p-5 border-b-2 border-slate-800 bg-white">
              <div className="flex items-center gap-3">
                <img
                  src="/gorepireo-logo.png"
                  alt="Go_Repireo"
                  className="h-9 w-9 object-contain"
                />
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900">
                    Go_Repireo Technologies
                  </h2>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    Central Personnel Directory • Digital Credential Verification Record
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-500 font-mono">
                <p className="font-bold text-slate-800">REF: {code}</p>
                <p>Checked: {nowFormatted}</p>
              </div>
            </div>

            {/* Verification Status Header Banner */}
            {result.status === 'REVOKED' ? (
              <div className="px-5 py-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
                      Record Status
                    </span>
                    <span className="text-sm font-extrabold text-rose-950">
                      ID CREDENTIAL REVOKED
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                  REVOKED
                </span>
              </div>
            ) : result.status === 'EXPIRED' ? (
              <div className="px-5 py-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                      Record Status
                    </span>
                    <span className="text-sm font-extrabold text-amber-950">
                      ID CREDENTIAL EXPIRED
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                  EXPIRED
                </span>
              </div>
            ) : (
              <div className="px-5 py-3.5 bg-emerald-50/70 border-b border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Official Personnel Record
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      Verified Active Credential
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-emerald-100/80 text-emerald-900 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Active
                </span>
              </div>
            )}

            {/* Profile Summary Block */}
            <div className="p-5 sm:p-6 bg-white border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-md bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {result.person?.photo_url ? (
                    <img
                      src={result.person.photo_url}
                      alt={result.person.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-slate-400 font-bold text-2xl">
                      {result.person?.name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                      {result.person?.type === 'INTERN' ? 'Intern' : 'Full-Time Employee'}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                      ID: {result.person?.code}
                    </span>
                  </div>

                  <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                    {result.person?.name}
                  </h1>
                  <p className="text-sm font-medium text-slate-600 mt-0.5">
                    {result.person?.designation}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Department: <span className="text-slate-800 font-medium">{result.person?.department}</span>
                  </p>
                </div>
              </div>

              {result.status === 'REVOKED' && result.revocation_reason && (
                <div className="mt-4 p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <span className="font-bold">Revocation Notice:</span> {result.revocation_reason}
                </div>
              )}
            </div>

            {/* Formal Credential Specification Table */}
            <div className="px-5 py-4 bg-slate-50/40">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Credential Specification
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                <div className="py-1 border-b border-slate-100">
                  <dt className="text-slate-500 font-normal">Card Reference Number</dt>
                  <dd className="font-mono font-semibold text-slate-900 mt-0.5">{result.card_number}</dd>
                </div>
                <div className="py-1 border-b border-slate-100">
                  <dt className="text-slate-500 font-normal">Issuing Organization</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">{result.company?.name || 'Go_Repireo'}</dd>
                </div>
                <div className="py-1 border-b border-slate-100">
                  <dt className="text-slate-500 font-normal">Issue Date</dt>
                  <dd className="font-medium text-slate-800 mt-0.5">{formatDate(result.valid_from)}</dd>
                </div>
                <div className="py-1 border-b border-slate-100">
                  <dt className="text-slate-500 font-normal">Valid Through</dt>
                  <dd className="font-medium text-slate-800 mt-0.5">{formatDate(result.valid_until)}</dd>
                </div>
                <div className="py-1 border-b border-slate-100 sm:border-b-0">
                  <dt className="text-slate-500 font-normal">Verification Authority</dt>
                  <dd className="font-medium text-slate-800 mt-0.5">Central Directory Services</dd>
                </div>
                <div className="py-1">
                  <dt className="text-slate-500 font-normal">Standing</dt>
                  <dd className="font-medium text-slate-800 mt-0.5">
                    {result.status === 'ACTIVE' ? 'Active & Authorized' : result.status}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Cryptographic / Institutional Authenticity Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-200">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="text-xs font-semibold text-slate-800">
                    Official Authenticity Attestation
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    This public verification page is served directly from the authoritative Go_Repireo personnel management database. The details displayed above correspond to an authentic digital credential issued by authorized administration.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
                    <span>Verified: {nowFormatted}</span>
                    <span>Ref: {code}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print-Only Verification Attestation Footer */}
            <div className="hidden print:flex items-center justify-between p-4 border-t border-slate-200 text-[10px] text-slate-500 bg-slate-50">
              <div>
                <p className="font-semibold text-slate-700 uppercase">Go_Repireo HR & Administration</p>
                <p>Computer-verified official credential record • Valid proof of active registry</p>
              </div>
              <div className="text-right font-mono text-[9px] text-slate-400">
                <p>gorepireo.in/verify/id/{code}</p>
                <p>{nowFormatted}</p>
              </div>
            </div>

            {/* Quick Actions (Hidden on print) */}
            <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Verification Summary
              </button>
              <a
                href="https://gorepireo.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition"
              >
                <span>gorepireo.in</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Institutional Page Footer (Hidden on print) */}
      <footer className="web-footer py-6 border-t border-slate-200 bg-white text-center text-[11px] text-slate-500 print:hidden">
        <p>
          © {new Date().getFullYear()} Go_Repireo. All rights reserved. • Central Credential Registry
        </p>
      </footer>
    </div>
  );
}

