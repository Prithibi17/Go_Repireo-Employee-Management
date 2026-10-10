import React, { useState } from 'react';
import { EmployeeAgreement } from '@/types';
import { Download, Mail, Edit, Trash2, CheckCircle, FileText, Send, Clock, Layers, Copy, Check } from 'lucide-react';
import { EmployeeAgreementFormModal } from './EmployeeAgreementFormModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface EmployeeAgreementDocumentProps {
  agreement: EmployeeAgreement;
  canManage?: boolean;
  onRefresh?: () => void;
  showFullDocument?: boolean;
}

export function EmployeeAgreementDocument({
  agreement,
  canManage = true,
  onRefresh,
  showFullDocument = true,
}: EmployeeAgreementDocumentProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activePageTab, setActivePageTab] = useState<'all' | '1' | '2' | '3'>('all');
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleDownloadPdf = () => {
    window.open(`/api/employee-agreements/${agreement.id}/pdf`, '_blank');
  };

  const handleMarkSent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employee-agreements/${agreement.id}/send`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setIsSendModalOpen(false);
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to update agreement status');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employee-agreements/${agreement.id}/delete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setIsDeleteDialogOpen(false);
        onRefresh?.();
      } else {
        alert(data.error || 'Failed to delete agreement');
      }
    } finally {
      setLoading(false);
    }
  };

  // Mailto link for sending agreement
  const emailSubject = encodeURIComponent(`Employee Agreement - Go_Repireo (${agreement.recipient_name})`);
  const rawEmailBody = `Dear ${agreement.recipient_name},

Please find your official 3-page Employee Agreement (Reference: ${agreement.agreement_number}) dated ${agreement.agreement_date} with Go_Repireo.

Please review the agreement thoroughly, sign where indicated on page 3, and share the signed copy back with us.

If you have any questions regarding the terms, feel free to reach out.

Warm regards,
Go_Repireo Team
contact@gorepireo.com`;

  const emailBody = encodeURIComponent(rawEmailBody);
  const mailtoLink = agreement.recipient_email
    ? `mailto:${agreement.recipient_email}?subject=${emailSubject}&body=${emailBody}`
    : `mailto:?subject=${emailSubject}&body=${emailBody}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawEmailBody);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Split address into multiple lines
  const addressLines = agreement.recipient_address
    .split('\n')
    .flatMap((line) => {
      if (line.length <= 48) return [line];
      const match = line.match(/.{1,45}(\s|$)/g);
      return match ? match.map((s) => s.trim()) : [line];
    });

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
                {agreement.agreement_number}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  agreement.status === 'SENT'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {agreement.status === 'SENT' ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Sent to Employee
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
              Agreement Date: <strong className="text-slate-700">{agreement.agreement_date}</strong>
              {agreement.sent_at && (
                <span> &bull; Sent on: {new Date(agreement.sent_at).toLocaleDateString('en-GB')}</span>
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
            title="Download Official 3-Page Vector PDF"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF (3 Pages)
          </button>

          {/* Send to Employee Button */}
          <button
            onClick={() => setIsSendModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition cursor-pointer"
            title="Send to Employee Email"
          >
            <Send className="w-3.5 h-3.5" />
            Send to Employee
          </button>

          {canManage && (
            <>
              {/* Edit Details */}
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition"
                title="Edit Agreement Details"
              >
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                Edit
              </button>

              {/* Delete Button */}
              <button
                onClick={() => setIsDeleteDialogOpen(true)}
                className="p-2 text-xs font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Delete Agreement"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Page Tabs */}
      {showFullDocument && (
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 mr-2 font-medium flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> View:
            </span>
            <button
              onClick={() => setActivePageTab('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                activePageTab === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All 3 Pages
            </button>
            <button
              onClick={() => setActivePageTab('1')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                activePageTab === '1'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Page 1
            </button>
            <button
              onClick={() => setActivePageTab('2')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                activePageTab === '2'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Page 2
            </button>
            <button
              onClick={() => setActivePageTab('3')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                activePageTab === '3'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Page 3
            </button>
          </div>
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            Matches official 3-page template with Times New Roman typography
          </span>
        </div>
      )}

      {/* Document Facsimile / Visual Preview */}
      {showFullDocument && (
        <div className="p-4 sm:p-8 bg-slate-200/50 flex flex-col items-center gap-8 overflow-x-auto">
          {/* PAGE 1 */}
          {(activePageTab === 'all' || activePageTab === '1') && (
            <div className="flex flex-col items-center">
              <div className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                Page 1 of 3 &bull; Terms, Recipient & Clauses 1–5
              </div>
              <div
                style={{ width: '794px', height: '1123px', fontFamily: "'Times New Roman', Times, serif" }}
                className="relative bg-white text-black shadow-2xl overflow-hidden select-text shrink-0 border border-slate-300"
              >
                {/* Page 1 Base Image */}
                <img
                  src="/agreement-page-1-base.png"
                  alt="Agreement Page 1"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />

                {/* Dynamic Date (Top Right) */}
                <div
                  style={{ top: '221px', left: '626px' }}
                  className="absolute z-10 font-bold text-[15.3px] leading-tight text-black"
                >
                  Date:- {agreement.agreement_date}
                </div>

                {/* Dynamic Recipient Title & Name */}
                <div
                  style={{ top: '258px', left: '51px' }}
                  className="absolute z-10 font-bold text-[15.3px] leading-tight text-black"
                >
                  {agreement.recipient_title} {agreement.recipient_name}
                </div>

                {/* Dynamic Address */}
                <div
                  style={{ top: '277px', left: '51px', maxWidth: '440px' }}
                  className="absolute z-10 text-[14px] leading-[1.32] text-black"
                >
                  {addressLines.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>

                {/* Dynamic Salutation */}
                <div
                  style={{ top: '347px', left: '51px' }}
                  className="absolute z-10 font-bold text-[14px] leading-tight text-black"
                >
                  {agreement.salutation}
                </div>
              </div>
            </div>
          )}

          {/* PAGE 2 */}
          {(activePageTab === 'all' || activePageTab === '2') && (
            <div className="flex flex-col items-center">
              <div className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                Page 2 of 3 &bull; Legal Clauses 6–12
              </div>
              <div
                style={{ width: '794px', height: '1123px', fontFamily: "'Times New Roman', Times, serif" }}
                className="relative bg-white text-black shadow-2xl overflow-hidden select-text shrink-0 border border-slate-300"
              >
                {/* Page 2 Base Image (100% static) */}
                <img
                  src="/agreement-page-2-base.png"
                  alt="Agreement Page 2"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              </div>
            </div>
          )}

          {/* PAGE 3 */}
          {(activePageTab === 'all' || activePageTab === '3') && (
            <div className="flex flex-col items-center">
              <div className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                Page 3 of 3 &bull; Clause 13 & Signatures
              </div>
              <div
                style={{ width: '794px', height: '1123px', fontFamily: "'Times New Roman', Times, serif" }}
                className="relative bg-white text-black shadow-2xl overflow-hidden select-text shrink-0 border border-slate-300"
              >
                {/* Page 3 Base Image */}
                <img
                  src="/agreement-page-3-base.png"
                  alt="Agreement Page 3"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />

                {/* Dynamic Date above Intern Signature (Right column) */}
                <div
                  style={{ top: '844px', left: '715px' }}
                  className="absolute z-10 text-[14.6px] leading-tight text-black"
                >
                  {agreement.agreement_date}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Send Email Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Send Employee Agreement</h3>
                <p className="text-xs text-slate-500">
                  Recipient: <strong className="text-slate-800">{agreement.recipient_name}</strong>
                  {agreement.recipient_email && ` (${agreement.recipient_email})`}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <p className="font-semibold text-slate-900 mb-1">
                  Subject: Employee Agreement - Go_Repireo ({agreement.recipient_name})
                </p>
                <div className="font-mono text-[11px] whitespace-pre-wrap text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                  {rawEmailBody}
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Tip: Attach the downloaded 3-page vector PDF file to your email client.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedEmail ? 'Copied' : 'Copy Email Text'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSendModalOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>

                <a
                  href={mailtoLink}
                  onClick={() => {
                    handleMarkSent();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Open in Mail App & Mark Sent
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Agreement Modal */}
      {isEditModalOpen && (
        <EmployeeAgreementFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          initialData={agreement}
          onSuccess={() => {
            setIsEditModalOpen(false);
            onRefresh?.();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Employee Agreement"
        message={`Are you sure you want to permanently delete agreement ${agreement.agreement_number} for ${agreement.recipient_name}? This action cannot be undone.`}
        confirmLabel={loading ? 'Deleting...' : 'Delete Agreement'}
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}
