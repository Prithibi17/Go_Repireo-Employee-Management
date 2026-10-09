import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Certificate } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PersonCodeChip } from '@/components/ui/Badges';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDate } from '@/lib/utils';
import { Award, Eye, Trash2 } from 'lucide-react';

interface CertificateListTableProps {
  certificates: Certificate[];
  canManage: boolean;
  onRefresh?: () => void;
}

export function CertificateListTable({ certificates, canManage, onRefresh }: CertificateListTableProps) {
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!selectedCert) return;
    setLoading(true);
    try {
      const res = await fetch('/api/certificates/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificate_id: selectedCert.id }),
      });
      const data = await res.json();
      if (data.success) {
        setShowDeleteDialog(false);
        setSelectedCert(null);
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to delete certificate');
      }
    } finally {
      setLoading(false);
    }
  };

  if (certificates.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="No certificates issued yet"
        description="Complete an active intern's tenure to prepare and issue their official certificate."
        actionHref="/people?type=INTERN"
        actionLabel="View Interns"
      />
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-[13px] text-zinc-600">
            <thead className="bg-zinc-50/70 text-zinc-400 text-[11px] font-medium uppercase tracking-wider border-b border-zinc-200/60">
              <tr>
                <th className="py-2.5 px-4">Certificate No.</th>
                <th className="py-2.5 px-4">Recipient</th>
                <th className="py-2.5 px-4">Intern ID</th>
                <th className="py-2.5 px-4">Internship Track</th>
                <th className="py-2.5 px-4">Duration</th>
                <th className="py-2.5 px-4">Issue Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {certificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-zinc-50/60 transition-colors group">
                  <td className="py-3 px-4">
                    <Link to={`/certificates/${cert.id}`} className="font-mono text-[11px] font-medium text-zinc-900 hover:underline">
                      {cert.certificate_number}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-medium text-zinc-900">
                    {cert.recipient_name_snapshot}
                  </td>
                  <td className="py-3 px-4">
                    <PersonCodeChip code={cert.person_code_snapshot} />
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-zinc-800">{cert.role_snapshot}</p>
                    <p className="text-[11px] text-zinc-400">{cert.department_snapshot}</p>
                  </td>
                  <td className="py-3 px-4 text-[12px] text-zinc-500">
                    {formatDate(cert.start_date_snapshot)} – {formatDate(cert.end_date_snapshot)}
                  </td>
                  <td className="py-3 px-4 text-[12px] text-zinc-500">
                    {formatDate(cert.issue_date)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={cert.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/certificates/${cert.id}`}
                        className="px-2.5 py-1 text-[12px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 opacity-60" />
                        View
                      </Link>
                      {canManage && (
                        <button
                          onClick={() => {
                            setSelectedCert(cert);
                            setShowDeleteDialog(true);
                          }}
                          title="Delete certificate"
                          className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Certificate?"
        description={`Are you sure you want to completely delete certificate ${selectedCert?.certificate_number}? This action removes it permanently from the database.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={loading}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setSelectedCert(null);
        }}
      />
    </>
  );
}
