import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { CertificateDetailPageClient } from '@/components/documents/CertificateDetailPageClient';
import { useAuth } from '@/context/AuthContext';

export function CertificateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadCertificate = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/certificates/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadCertificate();
  }, [loadCertificate]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading certificate...</div>;
  }

  if (!data?.certificate) {
    return <div className="p-8 text-center text-sm text-red-500">Certificate not found.</div>;
  }

  const { certificate, company } = data;
  const canRevoke = Boolean(user && ['OWNER', 'ADMIN'].includes(user.role));

  return (
    <CertificateDetailPageClient
      certificate={certificate}
      company={company}
      canRevoke={canRevoke}
      onRefresh={loadCertificate}
    />
  );
}
