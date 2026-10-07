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
    if (!cardContainerRef.current) {
      window.print();
      return;
    }

    const printContent = cardContainerRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=900,height=650');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print ID Card - ${person.full_name} (${person.person_code})</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: landscape;
              margin: 10mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            body {
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .print-wrapper {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: center;
              gap: 32px;
              margin: auto;
            }
            .id-card-box {
              width: 280px !important;
              height: 445px !important;
              box-shadow: none !important;
              border: 1px solid #cbd5e1 !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              background-color: #ffffff !important;
              border-radius: 16px !important;
              overflow: hidden !important;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
        className="id-card-print-area flex flex-wrap items-center justify-center gap-10 p-8 bg-slate-100/60 rounded-3xl border border-slate-200 shadow-inner print:bg-white print:border-none print:shadow-none print:p-0"
      >
        {/* ================= ID CARD FRONT ================= */}
        <div 
          style={{ width: '280px', height: '445px' }}
          className="id-card-box relative bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden flex flex-col justify-between text-slate-800 print:shadow-none print:border print:border-slate-300 select-none"
        >
          {/* Top Geometric Accent Bars: Blue on left, Orange on right */}
          <div className="absolute top-0 left-0 right-0 h-[6px] flex">
            <div className="w-[62%] h-full bg-[#16428c] rounded-bl-xs" />
            <div className="w-[38%] h-full bg-[#f97316]" />
          </div>

          {/* Background subtle geometric watermark */}
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none bg-[radial-gradient(#16428c_1px,transparent_1px)] [background-size:12px_12px]" />

          {/* Card Content Container */}
          <div className="relative z-10 flex-1 flex flex-col items-center pt-5 pb-3 px-5 text-center justify-between">
            {/* Header: Mascot + Company Wordmark */}
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <img 
                src="/gorepireo-mascot-modified.png" 
                alt="Go_Repireo" 
                className="w-10 h-10 object-contain drop-shadow-2xs" 
              />
              <div className="text-left flex flex-col">
                <span className="text-[14px] font-black tracking-tight text-[#0f274a] uppercase font-sans leading-none">
                  Go_Repireo
                </span>
                <span className="text-[7px] font-bold text-slate-500 tracking-wider uppercase mt-0.5">
                  BUILD | REPAIR | MAINTAIN
                </span>
              </div>
            </div>

            {/* Profile Photo with rounded-2xl container & dual border matching reference */}
            <div className="my-auto flex flex-col items-center">
              <div className="w-[108px] h-[108px] rounded-2xl p-[3px] bg-white border-[1.5px] border-slate-200 shadow-md">
                <div className="w-full h-full rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                  {person.profile_photo_path ? (
                    <img 
                      src={person.profile_photo_path} 
                      alt={person.full_name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-slate-200 to-slate-300 flex items-center justify-center font-black text-slate-600 text-3xl uppercase font-sans">
                      {person.full_name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* Name & Title */}
              <h3 className="font-black text-[#0f274a] text-[17px] tracking-tight leading-tight uppercase font-sans mt-2.5">
                {person.full_name}
              </h3>
              <p className="text-[11px] font-bold text-slate-600 tracking-wider uppercase mt-0.5">
                {person.designation || (person.person_type === 'EMPLOYEE' ? 'EMPLOYEE' : 'INTERN')}
              </p>

              {/* Status & Code pill row matching reference */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex flex-col items-center">
                  <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                    Status
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase tracking-wide bg-[#1e40af] text-white shadow-2xs">
                    {person.status === 'ACTIVE' 
                      ? (person.person_type === 'EMPLOYEE' ? 'EMPLOYEE' : 'INTERN') 
                      : person.status}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                    {person.person_type === 'EMPLOYEE' ? 'EMPLOYEE ID' : 'INTERN ID'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold text-slate-700 bg-white border border-slate-300 shadow-2xs">
                    {person.person_code}
                  </span>
                </div>
              </div>

              {/* Department Row */}
              <p className="text-[9.5px] font-bold text-slate-700 mt-2 uppercase tracking-wide">
                Department: <span className="text-slate-900 font-extrabold">{person.department?.name || 'TECHNOLOGY'}</span>
              </p>
            </div>

            {/* QR Code inside bordered container */}
            <div className="flex flex-col items-center mb-1">
              <div className="p-1 bg-white rounded-lg border border-slate-300 shadow-xs">
                <QRCodeImage url={verifyUrl} size={70} margin={0} />
              </div>
              <span className="text-[7.5px] font-extrabold text-slate-500 uppercase tracking-widest mt-1">
                SCAN TO VERIFY
              </span>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="border-t border-slate-100 py-1.5 bg-slate-50/90 text-center">
            <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider">
              SECURE DIGITAL ID • TAMPER-PROOF • VERIFIED
            </span>
          </div>
        </div>

        {/* ================= ID CARD BACK ================= */}
        <div 
          style={{ width: '280px', height: '445px' }}
          className="id-card-box relative bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden flex flex-col justify-between text-slate-800 print:shadow-none print:border print:border-slate-300 select-none p-5"
        >
          {/* Header with Mascot & Title */}
          <div className="flex flex-col items-center text-center pt-1 border-b border-slate-100 pb-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <img 
                src="/gorepireo-mascot-modified.png" 
                alt="Go_Repireo" 
                className="w-9 h-9 object-contain" 
              />
              <span className="text-[14px] font-black tracking-tight text-[#0f274a] uppercase font-sans">
                Go_Repireo
              </span>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              Official Identification Credential
            </p>
          </div>

          {/* Table of Verified Metadata */}
          <div className="my-auto space-y-2.5 text-[11px] px-1">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Issue Date:</span>
              <span className="font-bold text-slate-900">{formatDate(card.valid_from)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Valid Until:</span>
              <span className="font-bold text-slate-900">{formatDate(card.valid_until)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Card Ref.:</span>
              <span className="font-mono text-[10px] font-bold text-slate-800">{card.card_number}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Website:</span>
              <span className="font-semibold text-blue-600">
                {company.website?.replace(/^https?:\/\//, '') || 'gorepireo.in'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Support:</span>
              <span className="font-semibold text-slate-800">{company.support_email}</span>
            </div>
          </div>

          {/* Center Verified Badge */}
          <div className="flex flex-col items-center justify-center my-1 text-center">
            <div className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-700 mb-1">
              <ShieldCheck className="w-5 h-5 text-slate-800" />
            </div>
            <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider">
              SECURE DIGITAL ID • TAMPER-PROOF • VERIFIED
            </span>
          </div>

          {/* Bottom Geometric Accent Bars: Blue on left, Orange on right */}
          <div className="absolute bottom-0 left-0 right-0 h-[6px] flex">
            <div className="w-[62%] h-full bg-[#16428c]" />
            <div className="w-[38%] h-full bg-[#f97316]" />
          </div>
        </div>
      </div>
    </div>
  );
}
