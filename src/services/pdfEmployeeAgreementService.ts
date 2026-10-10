import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { EmployeeAgreement } from '../types';

async function loadBaseImage(fileName: string): Promise<Uint8Array> {
  const candidatePaths = [
    path.join(process.cwd(), 'public', fileName),
    path.join(process.cwd(), 'dist', fileName),
    path.join(process.cwd(), fileName),
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p);
      }
    } catch {
      // ignore
    }
  }

  // Fallback to live URL (e.g. on serverless deployment)
  try {
    const res = await fetch(`https://go-repireo-employee-management.vercel.app/${fileName}`);
    if (res.ok) {
      return new Uint8Array(await res.arrayBuffer());
    }
  } catch {
    // fallback
  }

  throw new Error(`Agreement base template image not found: ${fileName}`);
}

export async function generateOfficialEmployeeAgreementPdf(
  agreement: EmployeeAgreement
): Promise<Uint8Array> {
  const width = 595.5;
  const height = 842.25;

  const pdfDoc = await PDFDocument.create();

  // Load the 3 page base images
  const [baseBytes1, baseBytes2, baseBytes3] = await Promise.all([
    loadBaseImage('agreement-page-1-base.png'),
    loadBaseImage('agreement-page-2-base.png'),
    loadBaseImage('agreement-page-3-base.png'),
  ]);

  const [baseImg1, baseImg2, baseImg3] = await Promise.all([
    pdfDoc.embedPng(baseBytes1),
    pdfDoc.embedPng(baseBytes2),
    pdfDoc.embedPng(baseBytes3),
  ]);

  // Standard Times fonts to match the exact official agreement typography
  const fontRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const black = rgb(0.04, 0.04, 0.04);

  // Helper to wrap address text cleanly
  const wrapText = (text: string, maxWidth: number, font: any, fontSize: number): string[] => {
    const rawParagraphs = text.split('\n');
    const resultLines: string[] = [];

    for (const paragraph of rawParagraphs) {
      const words = paragraph.split(' ').filter(Boolean);
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) resultLines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) resultLines.push(currentLine);
    }
    return resultLines;
  };

  // ================= PAGE 1 =================
  const page1 = pdfDoc.addPage([width, height]);
  page1.drawImage(baseImg1, { x: 0, y: 0, width, height });

  // 1. Date (Top-Right): "Date:- 08/10/2026"
  const formattedDate = agreement.issue_date || new Date().toLocaleDateString('en-GB');
  const dateStr = `Date:- ${formattedDate}`;
  page1.drawText(dateStr, {
    x: 469.6,
    y: 673.5,
    size: 11.5,
    font: fontBold,
    color: black,
  });

  // 2. Recipient Name: "Mr. Pranshu Gur"
  const title = agreement.recipient_title ? `${agreement.recipient_title} ` : '';
  const fullName = `${title}${agreement.recipient_name || 'Candidate'}`;
  page1.drawText(fullName, {
    x: 38.3,
    y: 645.5,
    size: 11.5,
    font: fontBold,
    color: black,
  });

  // 3. Recipient Address
  const addressText = agreement.recipient_address || '';
  const addressLines = wrapText(addressText, 450, fontRoman, 10.5);
  let addrY = 631.5;
  for (const line of addressLines.slice(0, 3)) {
    page1.drawText(line, {
      x: 38.5,
      y: addrY,
      size: 10.5,
      font: fontRoman,
      color: black,
    });
    addrY -= 14.0;
  }

  // 4. Salutation: "Dear Pranshu,"
  const salutationName = agreement.salutation_name || agreement.recipient_name.split(' ')[0] || 'Candidate';
  const salutationStr = `Dear ${salutationName},`;
  page1.drawText(salutationStr, {
    x: 38.2,
    y: 579.0,
    size: 10.5,
    font: fontBold,
    color: black,
  });

  // ================= PAGE 2 =================
  const page2 = pdfDoc.addPage([width, height]);
  page2.drawImage(baseImg2, { x: 0, y: 0, width, height });

  // ================= PAGE 3 =================
  const page3 = pdfDoc.addPage([width, height]);
  page3.drawImage(baseImg3, { x: 0, y: 0, width, height });

  // 5. Acceptance Date above Signature line on Page 3
  page3.drawText(formattedDate, {
    x: 536.5,
    y: 206.8,
    size: 11,
    font: fontRoman,
    color: black,
  });

  return await pdfDoc.save();
}
