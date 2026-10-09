import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { OfferLetter } from '@/types';
import { PersonCodeChip } from '@/components/ui/Badges';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FileText, Download, Eye, Trash2, Send, CheckCircle, Clock } from 'lucide-react';

interface OfferLetterListTableProps {
  offerLetters: OfferLetter[];
  canManage: boolean;
  onRefresh?: () => void;
}

export function OfferLetterListTable({
  offerLetters,
  canManage,
  onRefresh,
}: OfferLetterListTableProps) {
  const [selectedOffer, setSelectedOffer] = useState<OfferLetter | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!selectedOffer) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/offer-letters/${selectedOffer.id}/delete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setShowDeleteDialog(false);
        setSelectedOffer(null);
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to delete offer letter');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = (id: string) => {
    window.open(`/api/offer-letters/${id}/pdf`, '_blank');
  };

  if (offerLetters.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No offer letters generated yet"
        description="Select a candidate or employee from the People directory to generate an official employment offer letter."
        actionHref="/people"
        actionLabel="Go to People Directory"
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
                <th className="py-2.5 px-4">Letter No.</th>
                <th className="py-2.5 px-4">Candidate</th>
                <th className="py-2.5 px-4">Candidate ID</th>
                <th className="py-2.5 px-4">Position & Dept</th>
                <th className="py-2.5 px-4">Joining Date</th>
                <th className="py-2.5 px-4">Duration</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {offerLetters.map((offer) => (
                <tr key={offer.id} className="hover:bg-zinc-50/60 transition-colors group">
                  <td className="py-3 px-4">
                    <Link
                      to={`/offer-letters/${offer.id}`}
                      className="font-mono text-[11px] font-medium text-indigo-700 hover:underline"
                    >
                      {offer.letter_number}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-medium text-zinc-900">
                    <div>
                      <span>{offer.recipient_name}</span>
                      <p className="text-[11px] text-zinc-400">{offer.recipient_email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {offer.person?.person_code ? (
                      <PersonCodeChip code={offer.person.person_code} />
                    ) : (
                      <span className="text-zinc-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-zinc-800">{offer.position}</p>
                    <p className="text-[11px] text-zinc-400">{offer.department || 'Technology'}</p>
                  </td>
                  <td className="py-3 px-4 text-[12px] text-zinc-600">
                    {offer.joining_date}
                  </td>
                  <td className="py-3 px-4 text-[12px] text-zinc-600">
                    {offer.duration}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        offer.status === 'SENT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {offer.status === 'SENT' ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Sent
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-600" />
                          Issued
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleDownloadPdf(offer.id)}
                        className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-zinc-100 rounded-md transition"
                        title="Download Vector PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <Link
                        to={`/offer-letters/${offer.id}`}
                        className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {canManage && (
                        <button
                          onClick={() => {
                            setSelectedOffer(offer);
                            setShowDeleteDialog(true);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                          title="Delete"
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

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Offer Letter"
        description={`Are you sure you want to delete Offer Letter ${selectedOffer?.letter_number}? This cannot be undone.`}
        confirmLabel="Delete Offer Letter"
        variant="danger"
        isLoading={loading}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setSelectedOffer(null);
        }}
      />
    </>
  );
}
