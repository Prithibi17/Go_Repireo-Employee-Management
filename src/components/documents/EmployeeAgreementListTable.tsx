import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmployeeAgreement } from '@/types';
import { PersonCodeChip } from '@/components/ui/Badges';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FileCheck, Download, Eye, Trash2, Send, CheckCircle, Clock } from 'lucide-react';

interface EmployeeAgreementListTableProps {
  agreements: EmployeeAgreement[];
  canManage: boolean;
  onRefresh?: () => void;
  onCreateNew?: () => void;
}

export function EmployeeAgreementListTable({
  agreements,
  canManage,
  onRefresh,
  onCreateNew,
}: EmployeeAgreementListTableProps) {
  const [selectedAgreement, setSelectedAgreement] = useState<EmployeeAgreement | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!selectedAgreement) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/employee-agreements/${selectedAgreement.id}/delete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setShowDeleteDialog(false);
        setSelectedAgreement(null);
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to delete employee agreement');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = (id: string) => {
    window.open(`/api/employee-agreements/${id}/pdf`, '_blank');
  };

  if (agreements.length === 0) {
    return (
      <EmptyState
        icon={FileCheck}
        title="No employee agreements generated yet"
        description="Generate an official 3-page vector PDF employee agreement by entering the recipient title, name, address, and date."
        onAction={onCreateNew}
        actionLabel="Generate Employee Agreement"
      />
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-[13px] text-zinc-600">
            <thead className="bg-zinc-50/70 text-zinc-400 text-[11px] font-medium uppercase tracking-wider border-b border-zinc-200/60">
              <tr>
                <th className="py-2.5 px-4">Agreement No.</th>
                <th className="py-2.5 px-4">Recipient</th>
                <th className="py-2.5 px-4">Employee ID</th>
                <th className="py-2.5 px-4">Address</th>
                <th className="py-2.5 px-4">Agreement Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {agreements.map((agreement) => (
                <tr key={agreement.id} className="hover:bg-zinc-50/60 transition-colors group">
                  <td className="py-3 px-4">
                    <Link
                      to={`/employee-agreements/${agreement.id}`}
                      className="font-mono text-[11px] font-medium text-indigo-700 hover:underline"
                    >
                      {agreement.agreement_number}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-medium text-zinc-900">
                    <div>
                      <span>{agreement.recipient_title} {agreement.recipient_name}</span>
                      {agreement.recipient_email && (
                        <p className="text-[11px] text-zinc-400">{agreement.recipient_email}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {agreement.person?.person_code ? (
                      <PersonCodeChip code={agreement.person.person_code} />
                    ) : (
                      <span className="text-zinc-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-zinc-500 max-w-[240px] truncate" title={agreement.recipient_address}>
                    {agreement.recipient_address.replace(/\n/g, ', ')}
                  </td>
                  <td className="py-3 px-4 text-zinc-700 font-medium whitespace-nowrap">
                    {agreement.agreement_date}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        agreement.status === 'SENT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {agreement.status === 'SENT' ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          Sent
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-500" />
                          Issued
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View Button */}
                      <Link
                        to={`/employee-agreements/${agreement.id}`}
                        className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                        title="View 3-Page Agreement"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {/* Download PDF Button */}
                      <button
                        onClick={() => handleDownloadPdf(agreement.id)}
                        className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition cursor-pointer"
                        title="Download 3-Page Vector PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      {canManage && (
                        <button
                          onClick={() => {
                            setSelectedAgreement(agreement);
                            setShowDeleteDialog(true);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                          title="Delete Agreement"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Delete Confirmation */}
      {selectedAgreement && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Delete Employee Agreement"
          message={`Are you sure you want to permanently delete agreement ${selectedAgreement.agreement_number} for ${selectedAgreement.recipient_name}?`}
          confirmLabel={loading ? 'Deleting...' : 'Delete Agreement'}
          isDestructive
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteDialog(false);
            setSelectedAgreement(null);
          }}
        />
      )}
    </>
  );
}
