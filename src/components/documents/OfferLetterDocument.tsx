import React, { useState } from 'react';
import { OfferLetter } from '@/types';
import { Download, Mail, Edit, Trash2, CheckCircle, FileText, Send, Calendar, Clock, MapPin, Building, User, ExternalLink } from 'lucide-react';
import { OfferLetterFormModal } from './OfferLetterFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface OfferLetterDocumentProps {
  offer: OfferLetter;
  canManage?: boolean;
  onRefresh?: () => void;
  showFullDocument?: boolean;
}

export function OfferLetterDocument({
  offer,
  canManage = true,
  onRefresh,
  showFullDocument = true,
}: OfferLetterDocumentProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDownloadPdf = () => {
    window.open(`/api/offer-letters/${offer.id}/pdf`, '_blank');
  };

  const handleMarkSent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/offer-letters/${offer.id}/send`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setIsSendModalOpen(false);
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to update offer letter status');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/offer-letters/${offer.id}/delete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setIsDeleteDialogOpen(false);
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to delete offer letter');
      }
    } finally {
      setLoading(false);
    }
  };

  // Mailto link for sending offer letter to candidate
  const emailSubject = encodeURIComponent(`Offer of Employment: ${offer.position} - ${offer.company_name || 'Go_Repireo'}`);
  const emailBody = encodeURIComponent(
`Dear ${offer.recipient_name},

Congratulations! We are delighted to extend you an offer for the position of ${offer.position} at ${offer.company_name || 'Go_Repireo'}.

Key Offer Summary:
• Position: ${offer.position}
• Duration: ${offer.duration}
• Joining Date: ${offer.joining_date}
• Work Mode: ${offer.work_mode}
• Stipend: ${offer.stipend}
• Reporting To: ${offer.reporting_to}

Please review your official Offer Letter attached (Reference: ${offer.letter_number}). Kindly reply confirming your acceptance of this offer.

We are excited to welcome you to our team!

Warm regards,
${offer.signatory_name}
${offer.signatory_title}, ${offer.company_name || 'Go_Repireo'}`
  );

  const mailtoLink = `mailto:${offer.recipient_email}?subject=${emailSubject}&body=${emailBody}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Top Action Bar */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {offer.letter_number}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  offer.status === 'SENT'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {offer.status === 'SENT' ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Sent to Candidate
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-amber-600" />
                    Issued (Ready to Send)
                  </>
                )}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Issued on: <strong className="text-slate-700">{offer.issue_date}</strong>
              {offer.sent_at && (
                <span> &bull; Sent on: {new Date(offer.sent_at).toLocaleDateString('en-GB')}</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Download Vector PDF Button */}
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition cursor-pointer"
            title="Download Official Vector PDF"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>

          {/* Send to Candidate Button */}
          <button
            onClick={() => setIsSendModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition cursor-pointer"
            title="Send to Candidate Email"
          >
            <Send className="w-3.5 h-3.5" />
            Send to Candidate
          </button>

          {canManage && (
            <>
              {/* Edit Details */}
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition"
                title="Edit Offer Details"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                Edit
              </button>

              {/* Delete Button */}
              <button
                onClick={() => setIsDeleteDialogOpen(true)}
                className="p-2 text-xs font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Delete Offer Letter"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Document Facsimile / Visual Preview */}
      {showFullDocument && (
        <div className="p-6 md:p-8 bg-slate-100/50 flex justify-center">
          <div className="w-full max-w-2xl bg-white border border-slate-200/90 shadow-md rounded-xl p-8 md:p-10 space-y-6 text-slate-800 text-xs sm:text-sm font-sans leading-relaxed select-text">
            {/* Header: Company & Date */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {offer.company_name || 'Go_Repireo'}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Home Services Platform</p>
              </div>
              <div className="text-right">
                <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                  Date: {offer.issue_date}
                </span>
                <p className="font-mono text-[11px] text-slate-400 mt-0.5">{offer.letter_number}</p>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="space-y-1 text-xs sm:text-sm text-slate-700">
              <p className="font-medium text-slate-500">To,</p>
              <p className="font-bold text-slate-900 text-sm sm:text-base">{offer.recipient_name}</p>
              {offer.recipient_location && <p className="text-slate-600">{offer.recipient_location}</p>}
              <p className="text-slate-600">Email: {offer.recipient_email}</p>
              {offer.recipient_phone && <p className="text-slate-600">Phone: {offer.recipient_phone}</p>}
            </div>

            {/* Salutation */}
            <div>
              <p className="font-bold text-slate-900">Dear {offer.recipient_name},</p>
            </div>

            {/* Opening Paragraph */}
            <p className="text-slate-700 leading-normal">
              We are pleased to offer you the position of <strong className="text-slate-900">{offer.position}</strong> at{' '}
              <strong className="text-slate-900">{offer.company_name || 'Go_Repireo'} (Home Services Platform)</strong>.
              We believe your skills and enthusiasm will be a valuable addition to our team.
            </p>

            {/* Offer Key Details Table/Card */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Key Offer Details:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4 text-xs sm:text-sm">
                <span className="font-medium text-slate-500">&bull; Position:</span>
                <span className="font-bold text-slate-900 sm:col-span-2">{offer.position}</span>

                <span className="font-medium text-slate-500">&bull; Duration:</span>
                <span className="font-bold text-slate-900 sm:col-span-2">{offer.duration}</span>

                <span className="font-medium text-slate-500">&bull; Stipend:</span>
                <span className="font-bold text-slate-900 sm:col-span-2">{offer.stipend}</span>

                <span className="font-medium text-slate-500">&bull; Work Mode:</span>
                <span className="font-bold text-slate-900 sm:col-span-2">{offer.work_mode}</span>

                <span className="font-medium text-slate-500">&bull; Reporting To:</span>
                <span className="font-bold text-slate-900 sm:col-span-2">{offer.reporting_to}</span>

                <span className="font-medium text-slate-500">&bull; Joining Date:</span>
                <span className="font-bold text-slate-900 sm:col-span-2">{offer.joining_date}</span>
              </div>
            </div>

            {/* Closing & Signatory */}
            <div className="pt-4 border-t border-slate-200 flex items-end justify-between">
              <div>
                <p className="text-slate-500 text-xs">For {offer.company_name || 'Go_Repireo'}</p>
                <div className="mt-4">
                  <p className="font-bold text-slate-900 text-sm tracking-wide uppercase">
                    {offer.signatory_name}
                  </p>
                  <p className="text-xs text-slate-600 font-medium uppercase">
                    {offer.signatory_title}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <button
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Official Template PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send to Candidate Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                Send Offer Letter to Candidate
              </h3>
              <button
                onClick={() => setIsSendModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                You can download the vector PDF to attach to the candidate's email, launch your email client with pre-drafted text, and mark this offer letter as <strong className="text-slate-900">SENT</strong>.
              </p>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div>
                  <span className="font-semibold text-slate-500">To:</span>{' '}
                  <span className="font-bold text-slate-900">{offer.recipient_email}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Subject:</span>{' '}
                  <span className="font-medium text-slate-800">
                    Offer of Employment: {offer.position} - {offer.company_name || 'Go_Repireo'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <a
                  href={mailtoLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleMarkSent}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition"
                >
                  <Mail className="w-4 h-4" />
                  Open in Email Client & Mark as Sent
                </a>

                <button
                  type="button"
                  onClick={handleMarkSent}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
                >
                  <CheckCircle className="w-4 h-4 text-slate-600" />
                  Mark as Sent without opening email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <OfferLetterFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          existingOffer={offer}
          onSuccess={() => {
            setIsEditModalOpen(false);
            onRefresh?.();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Offer Letter"
        description={`Are you sure you want to delete Offer Letter ${offer.letter_number} for ${offer.recipient_name}? This action cannot be undone.`}
        confirmLabel="Delete Offer Letter"
        variant="danger"
        isLoading={loading}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}
