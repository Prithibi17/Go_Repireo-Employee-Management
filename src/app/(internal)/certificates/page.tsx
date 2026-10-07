import React from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { DataService } from '@/services/dataService';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { Award, Eye, ShieldCheck, Download } from 'lucide-react';

export default async function CertificatesPage() {
  const certificates = await DataService.getCertificates();

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

      {certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates issued yet"
          description="Complete an active intern's tenure to prepare and issue their official certificate."
          actionHref="/people?type=INTERN"
          actionLabel="View Interns"
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Certificate No.</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Intern ID</th>
                  <th className="py-3 px-4">Internship Track</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900">
                      <Link href={`/certificates/${cert.id}`} className="hover:underline text-blue-600">
                        {cert.certificate_number}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {cert.recipient_name_snapshot}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-medium text-slate-700">
                      {cert.person_code_snapshot}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{cert.role_snapshot}</p>
                      <p className="text-xs text-slate-500">{cert.department_snapshot}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {formatDate(cert.start_date_snapshot)} – {formatDate(cert.end_date_snapshot)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {formatDate(cert.issue_date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={cert.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/certificates/${cert.id}`}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
