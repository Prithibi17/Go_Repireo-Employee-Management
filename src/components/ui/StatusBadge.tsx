import React from 'react';
import { IdCardStatus, CertificateStatus } from '@/types';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {status === 'ISSUED' ? 'Issued' : status === 'ACTIVE' ? 'Active' : 'Valid'}
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Expired
        </span>
      );
    case 'REVOKED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Revoked
        </span>
      );
    case 'DRAFT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
          Draft
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
          {status}
        </span>
      );
  }
}
