'use client';

import React, { useRef } from 'react';
import { Certificate, CompanySettings } from '@/types';
import { QRCodeImage } from '@/components/ui/QRCodeImage';
import { formatDate } from '@/lib/utils';
import { Download, Printer, ShieldCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CertificateDocumentProps {
  certificate: Certificate;
  company: CompanySettings;
  appUrl?: string;
  showActions?: boolean;
}

export function CertificateDocument({
  certificate,
  company,
  appUrl = 'http://localhost:3000',
  showActions = true,
}: CertificateDocumentProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const verifyUrl = `${appUrl}/verify/certificate/${certificate.public_verification_code}`;

  const handleDownloadPdf = () => {
    window.open(`/api/certificates/${certificate.id}/download`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedStartDate = formatDate(certificate.start_date_snapshot);
  const formattedEndDate = formatDate(certificate.end_date_snapshot);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Actions Toolbar */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6 print:hidden">
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            Download Certificate PDF
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            Print Certificate
          </button>
          <Link
            href={`/verify/certificate/${certificate.public_verification_code}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shadow-xs transition"
          >
            <ExternalLink className="w-4 h-4 text-blue-600" />
            Test Public Verification Page
          </Link>
        </div>
      )}

      {/* Landscape Official Certificate Layout */}
      <div className="overflow-x-auto w-full flex justify-center p-2">
        <div
          ref={certRef}
          style={{ width: '933px', height: '625px' }}
          className="relative bg-white text-slate-900 shadow-2xl overflow-hidden select-none print:shadow-none print:border-none"
        >
          {/* Official Background Template with Mascot, MSME seal, Signature, Seal & Graphics */}
          <img
            src="/certificate-base.png"
            alt="Official Go_Repireo Certificate Template"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />

          {/* Certificate Number Stamp (Top Right below MSME) */}
          <div className="absolute top-[138px] right-[46px] z-10 text-right">
            <span className="font-mono text-[10px] font-bold text-slate-500 bg-white/80 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
              {certificate.certificate_number}
            </span>
          </div>

          {/* Recipient Name Dynamic Field */}
          <div 
            style={{ top: '258px', left: '160px', right: '160px' }}
            className="absolute z-10 text-center flex flex-col items-center justify-center"
          >
            <h2 className="text-[34px] font-black text-[#0f274a] tracking-tight leading-none capitalize font-sans drop-shadow-2xs">
              {certificate.recipient_name_snapshot}
            </h2>
            <div className="w-[320px] h-[1.5px] bg-slate-800/80 mt-3" />
          </div>

          {/* Dynamic Internship Role, Company & Dates Paragraph */}
          <div 
            style={{ top: '344px', left: '180px', right: '180px' }}
            className="absolute z-10 text-center text-[13.5px] leading-relaxed text-slate-800 font-sans"
          >
            <p className="font-normal">
              has successfully completed an internship as a{' '}
              <strong className="font-black text-[#0b1b33]">
                {certificate.role_snapshot}
              </strong>{' '}
              at <strong className="font-bold text-[#0b1b33]">Go_Repireo</strong> from{' '}
              <strong className="font-black text-[#0b1b33]">{formattedStartDate}</strong> to{' '}
              <strong className="font-black text-[#0b1b33]">{formattedEndDate}</strong>.
            </p>
          </div>

          {/* Dynamic Verification QR Code inside the square border */}
          {/* Coordinates of square: x=623 to 710, y=484 to 572 */}
          <div
            style={{ 
              position: 'absolute',
              left: '625px', 
              top: '486px', 
              width: '83px', 
              height: '84px' 
            }}
            className="z-20 flex items-center justify-center p-0.5 bg-white rounded-lg shadow-2xs group"
          >
            <QRCodeImage 
              url={verifyUrl} 
              size={79} 
              className="w-full h-full object-contain rounded-md"
            />
          </div>

          {/* Scan to verify caption below QR code */}
          <div 
            style={{ 
              position: 'absolute',
              left: '600px', 
              top: '575px', 
              width: '135px'
            }}
            className="z-20 text-center"
          >
            <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest block">
              Scan to Verify
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
