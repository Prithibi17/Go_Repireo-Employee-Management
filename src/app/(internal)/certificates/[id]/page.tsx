import React from 'react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
import { DataService } from '@/services/dataService';
import { getCurrentUser, canIssueCertificates } from '@/lib/auth';
import { CertificateDetailPageClient } from '@/components/documents/CertificateDetailPageClient';

interface CertificateDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CertificateDetailPage({ params }: CertificateDetailPageProps) {
  const { id } = await params;
  const certificate = await DataService.getCertificateById(id);

  if (!certificate) {
    notFound();
  }

  const company = await DataService.getCompanySettings();
  const currentUser = await getCurrentUser();

  return (
    <CertificateDetailPageClient
      certificate={certificate}
      company={company}
      canRevoke={canIssueCertificates(currentUser.role)}
    />
  );
}
