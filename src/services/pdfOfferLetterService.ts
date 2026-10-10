import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { OfferLetter } from '../types';

export async function generateOfficialOfferLetterPdf(
  offer: OfferLetter
): Promise<Uint8Array> {
  const width = 791.25;
  const height = 1118.25;

  const pdfDoc = await PDFDocument.create();

  // Load the spotless high-resolution base template
  let baseBytes: Uint8Array | null = null;
  const candidatePaths = [
    path.join(process.cwd(), 'public', 'offer-letter-base.png'),
    path.join(process.cwd(), 'dist', 'offer-letter-base.png'),
    path.join(process.cwd(), 'offer-letter-base.png'),
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        baseBytes = fs.readFileSync(p);
        break;
      }
    } catch {
      // continue
    }
  }

  if (!baseBytes) {
    try {
      const res = await fetch('https://go-repireo-employee-management.vercel.app/offer-letter-base.png');
      if (res.ok) {
        baseBytes = new Uint8Array(await res.arrayBuffer());
      }
    } catch {
      // fallback
    }
  }

  if (!baseBytes) {
    throw new Error('Offer letter base template image not found');
  }

  const baseImg = await pdfDoc.embedPng(baseBytes);

  const page = pdfDoc.addPage([width, height]);
  page.drawImage(baseImg, {
    x: 0,
    y: 0,
    width,
    height,
  });

  // Fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const black = rgb(0.04, 0.04, 0.04);

  // Helper to wrap text cleanly
  const wrapText = (text: string, maxWidth: number, font: any, fontSize: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // 1. Date (Top-Right)
  const formattedDate = offer.issue_date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const dateStr = `Date: ${formattedDate}`;
  const dateWidth = fontBold.widthOfTextAtSize(dateStr, 13.5);
  page.drawText(dateStr, {
    x: Math.max(540, 742 - dateWidth),
    y: 818,
    size: 13.5,
    font: fontBold,
    color: black,
  });

  // 2. "To," Block (Left-Aligned)
  let toY = 776;
  page.drawText('To,', {
    x: 48,
    y: toY,
    size: 13.5,
    font: fontBold,
    color: black,
  });

  toY -= 19;
  const recipientName = offer.recipient_name || 'Candidate';
  page.drawText(recipientName, {
    x: 48,
    y: toY,
    size: 13.8,
    font: fontBold,
    color: black,
  });

  if (offer.recipient_location) {
    toY -= 17;
    page.drawText(offer.recipient_location, {
      x: 48,
      y: toY,
      size: 13.5,
      font: fontBold,
      color: black,
    });
  }

  if (offer.recipient_email) {
    toY -= 17;
    page.drawText(`Email: ${offer.recipient_email}`, {
      x: 48,
      y: toY,
      size: 13.5,
      font: fontBold,
      color: black,
    });
  }

  if (offer.recipient_phone) {
    toY -= 17;
    page.drawText(`Phone: ${offer.recipient_phone}`, {
      x: 48,
      y: toY,
      size: 13.5,
      font: fontBold,
      color: black,
    });
  }

  // 3. Salutation Block ("Dear <Recipient Name>,")
  page.drawText(`Dear ${recipientName},`, {
    x: 48,
    y: 654,
    size: 13.8,
    font: fontBold,
    color: black,
  });

  // 4. Opening Paragraph (Bold, matching the closing paragraph and template styling)
  const position = offer.position || 'Software Developer Intern';
  const companyPlatform = `${offer.company_name || 'Go_Repireo'} (Home Services Platform)`;
  const openingText = `We are pleased to offer you the position of ${position} at ${companyPlatform}. We believe your skills and enthusiasm will be a valuable addition to our team.`;
  const openingLines = wrapText(openingText, 695, fontBold, 12.8);

  let openY = 620;
  for (const line of openingLines) {
    page.drawText(line, {
      x: 48,
      y: openY,
      size: 12.8,
      font: fontBold,
      color: black,
    });
    openY -= 18;
  }

  // 5. Key Offer Details Values (Right column aligned at X: 238, bold 13.5pt)
  const vx = 238;
  page.drawText(position, {
    x: vx,
    y: 551,
    size: 13.5,
    font: fontBold,
    color: black,
  });

  const durationStr = offer.duration || '3 Months';
  page.drawText(durationStr, {
    x: vx,
    y: 516.5,
    size: 13.5,
    font: fontBold,
    color: black,
  });

  const stipendStr = offer.stipend || 'Unpaid';
  page.drawText(stipendStr, {
    x: vx,
    y: 482,
    size: 13.5,
    font: fontBold,
    color: black,
  });

  const workModeStr = offer.work_mode || 'Remote (with occasional team meetings)';
  page.drawText(workModeStr, {
    x: vx,
    y: 447.5,
    size: 13.5,
    font: fontBold,
    color: black,
  });

  const reportingToStr = offer.reporting_to || 'Prithibi Mandi (CTO)';
  page.drawText(reportingToStr, {
    x: vx,
    y: 413,
    size: 13.5,
    font: fontBold,
    color: black,
  });

  const joiningDateStr = offer.joining_date || '10 October 2026';
  page.drawText(joiningDateStr, {
    x: vx,
    y: 378.5,
    size: 13.5,
    font: fontBold,
    color: black,
  });

  return await pdfDoc.save();
}
