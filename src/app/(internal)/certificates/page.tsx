import React from 'react';
import { DataService } from '@/services/dataService';
import { getCurrentUser, canIssueCertificates } from '@/lib/auth';
import { CertificateListTable } from '@/components/documents/CertificateListTable';

export const dynamic = 'force-dynamic';

export default async function CertificatesPage() {
  const certificates = await DataService.getCertificates();
  const currentUser = await getCurrentUser();
  const canManage = canIssueCertificates(currentUser.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Certificates
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Official Go_Repireo internship completion certificates with tamper-proof QR verification.
          </p>
        </div>
      </div>

      <CertificateListTable
        certificates={certificates}
        canManage={canManage}
      />
    </div>
  );
}
