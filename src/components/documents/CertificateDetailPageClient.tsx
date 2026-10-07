'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Certificate, CompanySettings } from '@/types';
import { CertificateDocument } from '@/components/documents/CertificateDocument';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Ban, ExternalLink, User } from 'lucide-react';

interface CertificateDetailPageClientProps {
  certificate: Certificate;
  company: CompanySettings;
  canRevoke: boolean;
}

export function CertificateDetailPageClient({
  certificate,
  company,
  canRevoke,
}: CertificateDetailPageClientProps) {
  const router = useRouter();
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRevoke = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/certificates/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificate_id: certificate.id,
          reason: revokeReason || 'Administrative revocation',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowRevokeDialog(false);
        router.refresh();
      } else {
        alert(data.error || 'Failed to revoke certificate');
      }
    } finally {
      setLoading(false);
    }
  };

  const publicVerifyUrl = `/verify/certificate/${certificate.public_verification_code}`;

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/certificates"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-mono">
                {certificate.certificate_number}
              </h1>
              <StatusBadge status={certificate.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued to <span className="font-semibold text-slate-800">{certificate.recipient_name_snapshot}</span> ({certificate.person_code_snapshot}) on {formatDate(certificate.issue_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={publicVerifyUrl}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shadow-xs transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            Public Verification Page
          </Link>

          {canRevoke && certificate.status === 'ISSUED' && (
            <button
              onClick={() => setShowRevokeDialog(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
            >
              <Ban className="w-3.5 h-3.5" />
              Revoke Certificate
            </button>
          )}
        </div>
      </div>

      {certificate.status === 'REVOKED' && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-start gap-2">
          <Ban className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">This certificate has been revoked.</p>
            <p className="text-xs text-red-700 mt-0.5">
              Reason: {certificate.revocation_reason || 'Administrative correction'}. Public QR scanners will clearly see that this certificate is invalid.
            </p>
          </div>
        </div>
      )}

      {/* Certificate Document Display */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
        <CertificateDocument
          certificate={certificate}
          company={company}
          appUrl={process.env.NEXT_PUBLIC_APP_URL || 'https://go-repireo-employee-management.vercel.app'}
        />
      </div>

      {/* Revocation Dialog */}
      <ConfirmDialog
        isOpen={showRevokeDialog}
        title="Revoke Certificate?"
        description="This certificate was officially issued. Revoking it will preserve the audit snapshot, but anyone scanning the physical or printed QR code will be shown that the certificate is REVOKED."
        confirmLabel="Revoke Certificate"
        variant="danger"
        isLoading={loading}
        onConfirm={handleRevoke}
        onCancel={() => setShowRevokeDialog(false)}
      >
        <div className="pt-2 text-xs">
          <label className="block font-semibold text-slate-700 mb-1">Reason for Revocation</label>
          <input
            type="text"
            required
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            placeholder="e.g. Typo in name / Duplicate issuance / Disciplinary action"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
