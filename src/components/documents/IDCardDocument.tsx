'use client';

import React, { useRef } from 'react';
import { IdCard, Person, CompanySettings } from '@/types';
import { QRCodeImage } from '@/components/ui/QRCodeImage';
import { formatDate } from '@/lib/utils';
import { Download, Printer, ShieldCheck } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface IDCardDocumentProps {
  card: IdCard;
  person: Person;
  company: CompanySettings;
  appUrl?: string;
  showActions?: boolean;
}

export function IDCardDocument({
  card,
  person,
  company,
  appUrl = 'https://go-repireo-employee-management.vercel.app',
  showActions = true,
}: IDCardDocumentProps) {
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const verifyUrl = `${appUrl}/verify/id/${card.public_verification_code}`;

  const handleDownloadImage = async () => {
    if (!cardContainerRef.current) return;
    try {
      const canvas = await html2canvas(cardContainerRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `GoRepireo_ID_${person.person_code}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Failed to download image', e);
    }
  };

  const handleDownloadPdf = async () => {
    if (!cardContainerRef.current) return;
    try {
      const canvas = await html2canvas(cardContainerRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [120, 160],
      });
      pdf.addImage(imgData, 'PNG', 10, 10, 100, 140);
      pdf.save(`GoRepireo_ID_${person.person_code}.pdf`);
    } catch (e) {
      console.error('Failed to export PDF', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center">
      {/* Action Toolbar */}
      {showActions && (
        <div className="flex items-center gap-3 mb-6 print:hidden">
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
          <button
            onClick={handleDownloadImage}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Card
          </button>
        </div>
      )}

      {/* Side-by-side ID Card Front & Back */}
      <div 
        ref={cardContainerRef}
        className="flex flex-wrap items-center justify-center gap-8 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-xs print:bg-white print:border-none print:shadow-none print:p-0"
      >
        {/* ================= ID CARD FRONT ================= */}
        <div 
          style={{ width: '240px', height: '380px' }}
          className="relative bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col justify-between text-slate-800 print:shadow-none print:border print:border-slate-300"
        >
          {/* Top Brand Stripe */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-3 text-white text-center flex flex-col items-center justify-center relative">
            <div className="w-7 h-7 rounded-md bg-white p-0.5 shadow-xs mb-1">
              <img 
                src={company.logo_url || '/gorepireo-logo.png'} 
                alt="Go_Repireo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <h4 className="text-xs font-extrabold tracking-wider uppercase">{company.company_name}</h4>
            <p className="text-[8px] font-medium text-blue-100 tracking-wide">{company.tagline}</p>
          </div>

          {/* Photo & Details */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 text-center">
            {/* Profile Photo */}
            <div className="w-20 h-20 rounded-full border-2 border-blue-600 p-0.5 shadow-xs mb-2">
              {person.profile_photo_path ? (
                <img 
                  src={person.profile_photo_path} 
                  alt={person.full_name} 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-lg">
                  {person.full_name.charAt(0)}
                </div>
              )}
            </div>

            <h3 className="font-bold text-slate-900 text-sm leading-tight tracking-tight">
              {person.full_name}
            </h3>
            <p className="text-[11px] font-medium text-slate-600 mt-0.5 line-clamp-1">
              {person.designation}
            </p>

            {/* Badges */}
            <div className="flex items-center gap-1.5 my-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                person.person_type === 'EMPLOYEE' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'
              }`}>
                {person.person_type}
              </span>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                {person.person_code}
              </span>
            </div>

            <p className="text-[10px] text-slate-500 font-medium">
              Dept: {person.department?.name || 'General'}
            </p>

            {/* QR Code Container */}
            <div className="mt-2 flex flex-col items-center">
              <div className="p-1 bg-white rounded border border-slate-200 shadow-2xs">
                <QRCodeImage url={verifyUrl} size={64} />
              </div>
              <span className="text-[7.5px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                Scan to Verify
              </span>
            </div>
          </div>

          {/* Bottom Card Bar */}
          <div className="bg-slate-900 py-1 text-center">
            <span className="text-[7.5px] font-bold text-blue-400 tracking-widest uppercase">
              LEARN • BUILD • GROW
            </span>
          </div>
        </div>

        {/* ================= ID CARD BACK ================= */}
        <div 
          style={{ width: '240px', height: '380px' }}
          className="relative bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col justify-between text-slate-800 print:shadow-none print:border print:border-slate-300 p-4"
        >
          {/* Header */}
          <div className="border-b border-slate-200 pb-2 text-center">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              {company.company_name}
            </h4>
            <p className="text-[8.5px] text-slate-500">Official Identification Credential</p>
          </div>

          {/* Metadata info */}
          <div className="space-y-2 text-[10px] my-auto">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Issue Date:</span>
              <span className="font-semibold text-slate-800">{formatDate(card.valid_from)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Valid Until:</span>
              <span className="font-semibold text-slate-800">{formatDate(card.valid_until)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Card Ref:</span>
              <span className="font-mono text-[9px] text-slate-700">{card.card_number}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Website:</span>
              <span className="font-medium text-blue-600">{company.website?.replace('https://', '')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Support:</span>
              <span className="text-slate-700">{company.support_email}</span>
            </div>

            {/* Emergency note */}
            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center mt-3">
              <p className="text-[8.5px] text-slate-600 leading-snug">
                This credential is the property of <strong className="text-slate-900">{company.company_name}</strong>. If found, please return to the company office or contact support.
              </p>
            </div>
          </div>

          {/* Footer security tag */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1 text-[8px] text-slate-400">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            <span>Digital QR Tamper-Proof Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
