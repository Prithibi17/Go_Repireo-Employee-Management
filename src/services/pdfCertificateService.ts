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

  // 1. Cover original "Name" text and underline in template
  page.drawRectangle({
    x: 250,
    y: 360,
    width: 652,
    height: 90,
    color: rgb(1, 1, 1),
  });

  // 2. Draw dynamic recipient name (Uppercase, Centered, exact tone #0f274a)
  const name = (certificate.recipient_name_snapshot || '').toUpperCase();
  const nameFontSize = 38;
  const nameWidth = fontBold.widthOfTextAtSize(name, nameFontSize);
  const nameX = (width - nameWidth) / 2;
  const nameY = 398;

  page.drawText(name, {
    x: nameX,
    y: nameY,
    size: nameFontSize,
    font: fontBold,
    color: rgb(0.06, 0.15, 0.29), // #0f274a
  });

  // Draw separator line below name matching the template's line
  const lineLength = Math.max(nameWidth + 80, 412);
  page.drawLine({
    start: { x: (width - lineLength) / 2, y: 370 },
    end: { x: (width + lineLength) / 2, y: 370 },
    thickness: 1.5,
    color: rgb(0.1, 0.17, 0.29),
  });

  // 3. Cover original role & date text lines in template (from pdf_y 295 to 352)
  page.drawRectangle({
    x: 200,
    y: 295,
    width: 752,
    height: 57,
    color: rgb(1, 1, 1),
  });

  // 4. Draw dynamic role & dates text lines exactly matching original typography and baselines
  const formattedStart = formatDate(certificate.start_date_snapshot);
  const formattedEnd = formatDate(certificate.end_date_snapshot);
  const roleText = certificate.role_snapshot;

  const fontSize = 15;
  const textColor = rgb(0.17, 0.24, 0.31); // #2c3e50
  const boldColor = rgb(0.04, 0.11, 0.2);  // #0b1b33

  // Line 1: has successfully completed an internship as a [Role] at
  const line1Prefix = 'has successfully completed an internship as a ';
  const line1Suffix = ' at';
  const prefixW = fontNormal.widthOfTextAtSize(line1Prefix, fontSize);
  const roleW = fontBold.widthOfTextAtSize(roleText, fontSize);
  const suffixW = fontNormal.widthOfTextAtSize(line1Suffix, fontSize);
  const totalL1 = prefixW + roleW + suffixW;
  const line1X = (width - totalL1) / 2;

  page.drawText(line1Prefix, {
    x: line1X,
    y: 334,
    size: fontSize,
    font: fontNormal,
    color: textColor,
  });

  page.drawText(roleText, {
    x: line1X + prefixW,
    y: 334,
    size: fontSize,
    font: fontBold,
    color: boldColor,
  });

  page.drawText(line1Suffix, {
    x: line1X + prefixW + roleW,
    y: 334,
    size: fontSize,
    font: fontNormal,
    color: textColor,
  });

  // Line 2: Go_Repireo from [Start Date] to [End Date].
  const line2Part1 = 'Go_Repireo';
  const line2Part2 = ' from ';
  const line2Part3 = ' to ';
  const line2Part4 = `${formattedEnd}.`;

  const p1W = fontBold.widthOfTextAtSize(line2Part1, fontSize);
  const p2W = fontNormal.widthOfTextAtSize(line2Part2, fontSize);
  const startW = fontBold.widthOfTextAtSize(formattedStart, fontSize);
  const p3W = fontNormal.widthOfTextAtSize(line2Part3, fontSize);
  const endW = fontBold.widthOfTextAtSize(line2Part4, fontSize);
  const totalL2 = p1W + p2W + startW + p3W + endW;
  const line2X = (width - totalL2) / 2;

  let curX = line2X;
  page.drawText(line2Part1, {
    x: curX,
    y: 312,
    size: fontSize,
    font: fontBold,
    color: boldColor,
  });
  curX += p1W;

  page.drawText(line2Part2, {
    x: curX,
    y: 312,
    size: fontSize,
    font: fontNormal,
    color: textColor,
  });
  curX += p2W;

  page.drawText(formattedStart, {
    x: curX,
    y: 312,
    size: fontSize,
    font: fontBold,
    color: boldColor,
  });
  curX += startW;

  page.drawText(line2Part3, {
    x: curX,
    y: 312,
    size: fontSize,
    font: fontNormal,
    color: textColor,
  });
  curX += p3W;

  page.drawText(line2Part4, {
    x: curX,
    y: 312,
    size: fontSize,
    font: fontBold,
    color: boldColor,
  });

  // 5. Generate QR Code image PNG buffer with margin 0 for perfect centering
  const verifyUrl = `${appUrl}/verify/certificate/${certificate.public_verification_code}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 300,
    margin: 0,
    color: { dark: '#000000', light: '#ffffff' },
  });
  const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  const qrImage = await pdfDoc.embedPng(qrImageBytes);

  // Clear inner box cleanly before drawing QR code
  // The square border in the vector PDF is at x: 767 to 877 (w: 110), y: 60 to 170 (h: 110)
  page.drawRectangle({
    x: 770,
    y: 63,
    width: 104,
    height: 104,
    color: rgb(1, 1, 1),
  });

  // Perfectly centered inside the 110x110 border box with 7-8px equal margins on all sides
  const qrSize = 95;
  const qrX = 774.5;
  const qrY = 74.5;

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  // 6. Draw certificate number badge under MSME
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
