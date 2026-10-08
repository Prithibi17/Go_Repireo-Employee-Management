import React, { useEffect, useState, useCallback } from 'react';
import { CertificateListTable } from '@/components/documents/CertificateListTable';
import { useAuth } from '@/context/AuthContext';
import { Certificate } from '@/types';

export function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCertificates = useCallback(() => {
    setLoading(true);
    fetch('/api/certificates')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCertificates(data.certificates);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  const canManage = Boolean(user && ['OWNER', 'ADMIN'].includes(user.role));

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

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
          Loading certificates...
        </div>
      ) : (
        <CertificateListTable
          certificates={certificates}
          canManage={canManage}
          onRefresh={loadCertificates}
        />
      )}
    </div>
  );
}
