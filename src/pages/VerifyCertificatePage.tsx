import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatDate, formatDateTime } from '@/lib/utils';
import { CheckCircle2, XCircle, ShieldCheck, Award } from 'lucide-react';

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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (!result || result.status === 'NOT_FOUND') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-between p-4 sm:p-6 text-slate-800">
        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 mx-auto flex items-center justify-center p-2 shadow-sm mb-3">
              <img src="/gorepireo-logo.png" alt="Go_Repireo" className="w-12 h-12 object-contain" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Go_Repireo</h2>
            <p className="text-xs font-semibold text-blue-600 tracking-wider uppercase">Learn • Build • Grow</p>
            <p className="text-[11px] text-slate-500 mt-1">Official Internship Certificate Verification</p>
          </div>

          <div className="bg-white rounded-2xl border border-red-200 shadow-md p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <XCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Certificate Not Found</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                We could not find an official Go_Repireo certificate associated with this QR verification code.
              </p>
            </div>
            <p className="text-[10px] text-slate-400">Checked on {nowFormatted}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between p-4 sm:p-6 text-slate-800">
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 mx-auto flex items-center justify-center p-2 shadow-sm mb-3">
            <img src="/gorepireo-logo.png" alt="Go_Repireo" className="w-12 h-12 object-contain" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {result.company?.name || 'Go_Repireo'}
          </h2>
          <p className="text-xs font-semibold text-blue-600 tracking-wider uppercase">
            {result.company?.tagline || 'Learn • Build • Grow'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Official Internship Certificate Verification</p>
        </div>

        {result.status === 'REVOKED' ? (
          <div className="bg-white rounded-2xl border border-red-300 shadow-md p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-red-100 text-red-800 border border-red-200">
                CERTIFICATE REVOKED
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-2">
                This certificate was issued by Go_Repireo but is no longer considered valid.
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {result.revocation_reason ? `Reason: ${result.revocation_reason}` : 'Administrative correction or revocation by authorized management.'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Certificate Number:</span>
                <span className="font-mono font-bold text-slate-800">{result.certificate_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-red-600">REVOKED</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
              Verified by Go_Repireo • Checked: {nowFormatted}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-emerald-300 shadow-lg p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-800">
                    ✓ VERIFIED CERTIFICATE
                  </h3>
                  <p className="text-[10px] text-slate-500">Certificate of Internship</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                VALID
              </span>
            </div>

            <div className="py-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Awarded To</span>
              <h4 className="text-xl font-black text-slate-900 mt-0.5">
                {result.snapshot?.name}
              </h4>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                {result.snapshot?.role}
              </p>
            </div>

            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 text-xs space-y-2.5">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Certificate No:</span>
                <span className="font-mono font-bold text-slate-900">{result.certificate_number}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Intern ID:</span>
                <span className="font-mono font-bold text-slate-800">{result.snapshot?.person_code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Department:</span>
                <span className="font-semibold text-slate-800">{result.snapshot?.department}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Duration:</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(result.snapshot?.start_date)} – {formatDate(result.snapshot?.end_date)}
                </span>
              </div>
              {result.snapshot?.project && (
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Project:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[200px]">{result.snapshot.project}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Issue Date:</span>
                <span className="font-semibold text-slate-800">{formatDate(result.issue_date)}</span>
              </div>
            </div>

            {result.certificate_id && (
              <div className="pt-2">
                <a
                  href={`/api/certificates/${result.certificate_id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <Award className="w-4 h-4" />
                  Download Official Certificate (PDF)
                </a>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600">
                <ShieldCheck className="w-4 h-4" />
                <span>This certificate was issued and digitally verified by Go_Repireo.</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Checked: {nowFormatted}
              </p>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <a
            href="https://gorepireo.in"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition"
          >
            gorepireo.in
          </a>
        </div>
      </div>
    </div>
  );
}
