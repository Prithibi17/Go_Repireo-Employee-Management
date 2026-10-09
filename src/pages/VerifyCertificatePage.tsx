import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatDate, formatDateTime } from '@/lib/utils';
import { CheckCircle2, XCircle, ShieldCheck, Award, Lock, ExternalLink, Printer } from 'lucide-react';

export function VerifyCertificatePage() {
  const { code } = useParams<{ code: string }>();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    fetch(`/api/verify/certificate/${code}`)
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
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Resolving Certificate Record...</p>
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
                Official Credential Registry
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/80">
              <Lock className="w-3 h-3 text-slate-500" />
              Certificate Verification Portal
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
                <h1 className="text-sm font-bold text-rose-950">Certificate Not Found</h1>
                <p className="text-xs text-rose-800/80">The provided verification reference could not be resolved.</p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-600">
              <p className="leading-relaxed">
                The identifier <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-semibold">{code}</code> is not associated with any authentic certificate in the Go_Repireo registry.
              </p>
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-slate-500 space-y-1 text-[11px]">
                <p className="font-semibold text-slate-700">Possible Causes:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>The QR code or verification link is invalid or incomplete.</li>
                  <li>The certificate was not officially issued or published by management.</li>
                  <li>The certificate record was revoked or permanently removed.</li>
                </ul>
              </div>
              <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100 flex justify-between">
                <span>Timestamp: {nowFormatted}</span>
                <span>Registry: CERT-VERIFY-SVC</span>
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
                    Official Credential Registry • Internship Certificate Verification Record
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-500 font-mono">
                <p className="font-bold text-slate-800">REF: {code}</p>
                <p>Checked: {nowFormatted}</p>
              </div>
            </div>

            {/* Status Header */}
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
                      CERTIFICATE REVOKED
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                  REVOKED
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
                      Authentic Credential Record
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      Verified Certificate of Internship
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-emerald-100/80 text-emerald-900 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Valid & Authentic
                </span>
              </div>
            )}

            {/* Recipient Profile Section */}
            <div className="p-5 sm:p-6 bg-white border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Conferred To
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                {result.snapshot?.name}
              </h1>
              <p className="text-sm font-medium text-slate-700 mt-0.5">
                {result.snapshot?.role}
              </p>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                  Intern Code: {result.snapshot?.person_code}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Department: <span className="text-slate-800">{result.snapshot?.department}</span>
                </span>
              </div>

              {result.status === 'REVOKED' && result.revocation_reason && (
                <div className="mt-4 p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  <span className="font-bold">Revocation Notice:</span> {result.revocation_reason}
                </div>
              )}
            </div>

            {/* Credential Specification Table */}
            <div className="px-5 py-4 bg-slate-50/40">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Certificate Details
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                <div className="py-1 border-b border-slate-100">
                  <dt className="text-slate-500 font-normal">Certificate Number</dt>
                  <dd className="font-mono font-semibold text-slate-900 mt-0.5">{result.certificate_number}</dd>
                </div>
                <div className="py-1 border-b border-slate-100">
                  <dt className="text-slate-500 font-normal">Issuing Organization</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">{result.company?.name || 'Go_Repireo'}</dd>
                </div>
                <div className="py-1 border-b border-slate-100">
                  <dt className="text-slate-500 font-normal">Internship Duration</dt>
                  <dd className="font-medium text-slate-800 mt-0.5">
                    {formatDate(result.snapshot?.start_date)} – {formatDate(result.snapshot?.end_date)}
                  </dd>
                </div>
                <div className="py-1 border-b border-slate-100">
                  <dt className="text-slate-500 font-normal">Issue Date</dt>
                  <dd className="font-medium text-slate-800 mt-0.5">{formatDate(result.issue_date)}</dd>
                </div>
                {result.snapshot?.project && (
                  <div className="py-1 border-b border-slate-100 sm:border-b-0 sm:col-span-2">
                    <dt className="text-slate-500 font-normal">Project / Domain Scope</dt>
                    <dd className="font-medium text-slate-800 mt-0.5">{result.snapshot.project}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* PDF Download if available */}
            {result.certificate_id && (
              <div className="p-4 bg-white border-t border-slate-100 print:hidden">
                <a
                  href={`/api/certificates/${result.certificate_id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition shadow-xs"
                >
                  <Award className="w-4 h-4" />
                  Download Official Certificate PDF
                </a>
              </div>
            )}

            {/* Cryptographic / Institutional Authenticity Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-200">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="text-xs font-semibold text-slate-800">
                    Official Authenticity Attestation
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    This document was officially issued by Go_Repireo Technologies and digitally registered in the company's central credentials directory. Its authenticity is guaranteed by administrative cryptographic verification.
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
                <p>Computer-verified official credential record • Valid proof of internship award</p>
              </div>
              <div className="text-right font-mono text-[9px] text-slate-400">
                <p>gorepireo.in/verify/certificate/{code}</p>
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

