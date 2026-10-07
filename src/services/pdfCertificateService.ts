import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { Certificate } from '@/types';
import { formatDate } from '@/lib/utils';

export async function generateOfficialCertificatePdf(
  certificate: Certificate,
  appUrl: string = 'http://localhost:3000'
): Promise<Uint8Array> {
  const templatePath = path.join(process.cwd(), 'public', 'official-certificate-template.pdf');
  const templateBytes = fs.readFileSync(templatePath);

  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPage(0);
  const width = page.getWidth(); // 1152
  const height = page.getHeight(); // 768

  // Embed standard typography fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 1. Cover original "Name" text
  page.drawRectangle({
    x: 320,
    y: 360,
    width: 512,
    height: 80,
    color: rgb(1, 1, 1),
  });

  // 2. Draw dynamic recipient name
  const name = certificate.recipient_name_snapshot;
  const nameFontSize = 36;
  const nameWidth = fontBold.widthOfTextAtSize(name, nameFontSize);
  const nameX = (width - nameWidth) / 2;
  const nameY = 390;

  page.drawText(name, {
    x: nameX,
    y: nameY,
    size: nameFontSize,
    font: fontBold,
    color: rgb(0.06, 0.15, 0.29), // #0f274a
  });

  // Draw separator line below name
  const lineLength = Math.max(nameWidth + 60, 360);
  page.drawLine({
    start: { x: (width - lineLength) / 2, y: nameY - 14 },
    end: { x: (width + lineLength) / 2, y: nameY - 14 },
    thickness: 1.5,
    color: rgb(0.1, 0.15, 0.25),
  });

  // 3. Cover original role & date text line
  page.drawRectangle({
    x: 200,
    y: 285,
    width: 752,
    height: 52,
    color: rgb(1, 1, 1),
  });

  // 4. Draw dynamic role & dates text
  const formattedStart = formatDate(certificate.start_date_snapshot);
  const formattedEnd = formatDate(certificate.end_date_snapshot);
  const roleText = certificate.role_snapshot;

  // Line 1: has successfully completed an internship as a [Role] at
  const line1Prefix = 'has successfully completed an internship as a ';
  const line1Suffix = ' at';
  const fullLine1 = `${line1Prefix}${roleText}${line1Suffix}`;
  const line1FontSize = 14;
  const line1Width = fontNormal.widthOfTextAtSize(fullLine1, line1FontSize);
  const line1X = (width - line1Width) / 2;

  page.drawText(line1Prefix, {
    x: line1X,
    y: 312,
    size: line1FontSize,
    font: fontNormal,
    color: rgb(0.2, 0.25, 0.3),
  });

  const prefixW = fontNormal.widthOfTextAtSize(line1Prefix, line1FontSize);
  page.drawText(roleText, {
    x: line1X + prefixW,
    y: 312,
    size: line1FontSize,
    font: fontBold,
    color: rgb(0.05, 0.1, 0.2),
  });

  const roleW = fontBold.widthOfTextAtSize(roleText, line1FontSize);
  page.drawText(line1Suffix, {
    x: line1X + prefixW + roleW,
    y: 312,
    size: line1FontSize,
    font: fontNormal,
    color: rgb(0.2, 0.25, 0.3),
  });

  // Line 2: Go_Repireo from [Start Date] to [End Date].
  const line2Part1 = 'Go_Repireo from ';
  const line2Part2 = ' to ';
  const fullLine2 = `${line2Part1}${formattedStart}${line2Part2}${formattedEnd}.`;
  const line2Width = fontNormal.widthOfTextAtSize(fullLine2, line1FontSize);
  const line2X = (width - line2Width) / 2;

  page.drawText(line2Part1, {
    x: line2X,
    y: 294,
    size: line1FontSize,
    font: fontBold,
    color: rgb(0.05, 0.1, 0.2),
  });

  const p1W = fontBold.widthOfTextAtSize(line2Part1, line1FontSize);
  page.drawText(formattedStart, {
    x: line2X + p1W,
    y: 294,
    size: line1FontSize,
    font: fontBold,
    color: rgb(0.05, 0.1, 0.2),
  });

  const startW = fontBold.widthOfTextAtSize(formattedStart, line1FontSize);
  page.drawText(line2Part2, {
    x: line2X + p1W + startW,
    y: 294,
    size: line1FontSize,
    font: fontNormal,
    color: rgb(0.2, 0.25, 0.3),
  });

  const p2W = fontNormal.widthOfTextAtSize(line2Part2, line1FontSize);
  page.drawText(`${formattedEnd}.`, {
    x: line2X + p1W + startW + p2W,
    y: 294,
    size: line1FontSize,
    font: fontBold,
    color: rgb(0.05, 0.1, 0.2),
  });

  // 5. Generate QR Code image PNG buffer
  const verifyUrl = `${appUrl}/verify/certificate/${certificate.public_verification_code}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 250,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });
  const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  const qrImage = await pdfDoc.embedPng(qrImageBytes);

  // The square border in the vector PDF is around x: 770, y: 64, size: 106x106
  const qrSize = 100;
  const qrX = 771;
  const qrY = 66;

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  // 6. Draw certificate number badge
  const certNumber = certificate.certificate_number;
  page.drawText(certNumber, {
    x: 990,
    y: 596,
    size: 10,
    font: fontBold,
    color: rgb(0.3, 0.35, 0.4),
  });

  return await pdfDoc.save();
}
