import React from 'react';
import { IdCardStatus, CertificateStatus } from '@/types';

export function StatusBadge({ 
  status 
}: { 
  status: IdCardStatus | CertificateStatus | string 
}) {
  switch (status) {
    case 'ACTIVE':
    case 'ISSUED':
    case 'VALID':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          {status === 'ISSUED' ? 'Issued' : status === 'ACTIVE' ? 'Active' : 'Valid'}
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-700 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          Expired
        </span>
      );
    case 'REVOKED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-500/10 text-rose-700 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          Revoked
        </span>
      );
    case 'DRAFT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
          Draft
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
          {status}
        </span>
      );
  }
}
