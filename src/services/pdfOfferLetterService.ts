import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { OfferLetter } from '../types';

export async function generateOfficialOfferLetterPdf(
  offer: OfferLetter
): Promise<Uint8Array> {
  const templatePath = path.join(process.cwd(), 'public', 'official-offer-letter-template.pdf');
  const templateBytes = fs.readFileSync(templatePath);

  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPage(0);

  // Fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const black = rgb(0, 0, 0);
  const textDark = rgb(0.12, 0.12, 0.12);
  const white = rgb(1, 1, 1);

  // 1. Date (Top-Right)
  // Cover original Date
  page.drawRectangle({
    x: 560,
    y: 775,
    width: 190,
    height: 40,
    color: white,
  });

  const formattedDate = offer.issue_date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const dateStr = `Date: ${formattedDate}`;
  const dateWidth = fontBold.widthOfTextAtSize(dateStr, 12);
  // Align to right edge (~ X: 742)
  page.drawText(dateStr, {
    x: Math.max(570, 742 - dateWidth),
    y: 790,
    size: 12,
    font: fontBold,
    color: black,
  });

  // 2. "To," Block (Left-Aligned)
  // Cover original recipient details
  page.drawRectangle({
    x: 45,
    y: 670,
    width: 480,
    height: 115,
    color: white,
  });

  let toY = 765;
  page.drawText('To,', {
    x: 48,
    y: toY,
    size: 12.5,
    font: fontRegular,
    color: black,
  });

  toY -= 19;
  const recipientName = offer.recipient_name || 'Candidate';
  page.drawText(recipientName, {
    x: 48,
    y: toY,
    size: 13,
    font: fontBold,
    color: black,
  });

  if (offer.recipient_location) {
    toY -= 17;
    page.drawText(offer.recipient_location, {
      x: 48,
      y: toY,
      size: 11.5,
      font: fontRegular,
      color: textDark,
    });
  }

  if (offer.recipient_email) {
    toY -= 17;
    page.drawText(`Email: ${offer.recipient_email}`, {
      x: 48,
      y: toY,
      size: 11.5,
      font: fontRegular,
      color: textDark,
    });
  }

  if (offer.recipient_phone) {
    toY -= 17;
    page.drawText(`Phone: ${offer.recipient_phone}`, {
      x: 48,
      y: toY,
      size: 11.5,
      font: fontRegular,
      color: textDark,
    });
  }

  // 3. Salutation Block ("Dear <Recipient Name>,")
  page.drawRectangle({
    x: 45,
    y: 635,
    width: 450,
    height: 30,
    color: white,
  });

  page.drawText(`Dear ${recipientName},`, {
    x: 48,
    y: 642,
    size: 12.5,
    font: fontBold,
    color: black,
  });

  // 4. Opening Paragraph
  // Cover original opening paragraph
  page.drawRectangle({
    x: 45,
    y: 580,
    width: 700,
    height: 52,
    color: white,
  });

  const position = offer.position || 'Software Developer Intern';
  const companyPlatform = `${offer.company_name || 'Go_Repireo'} (Home Services Platform)`;
  const line1 = `We are pleased to offer you the position of ${position} at ${companyPlatform}. We`;
  const line2 = `believe your skills and enthusiasm will be a valuable addition to our team.`;

  page.drawText(line1, {
    x: 48,
    y: 610,
    size: 11,
    font: fontRegular,
    color: textDark,
  });

  page.drawText(line2, {
    x: 48,
    y: 594,
    size: 11,
    font: fontRegular,
    color: textDark,
  });

  // 5. Key Offer Details Values (Right column of bulleted list)
  // Cover original bullet values
  page.drawRectangle({
    x: 230,
    y: 380,
    width: 515,
    height: 200,
    color: white,
  });

  // Value lines at precise vertical steps
  page.drawText(position, {
    x: 238,
    y: 566,
    size: 11.5,
    font: fontBold,
    color: black,
  });

  const durationStr = offer.duration || '3 Months';
  page.drawText(durationStr, {
    x: 238,
    y: 531,
    size: 11.5,
    font: fontBold,
    color: black,
  });

  const stipendStr = offer.stipend || 'Unpaid';
  page.drawText(stipendStr, {
    x: 238,
    y: 497,
    size: 11.5,
    font: fontBold,
    color: black,
  });

  const workModeStr = offer.work_mode || 'Remote (with occasional team meetings)';
  page.drawText(workModeStr, {
    x: 238,
    y: 463,
    size: 11.5,
    font: fontBold,
    color: black,
  });

  const reportingToStr = offer.reporting_to || 'Prithibi Mandi (CTO)';
  page.drawText(reportingToStr, {
    x: 238,
    y: 428,
    size: 11.5,
    font: fontBold,
    color: black,
  });

  const joiningDateStr = offer.joining_date || '10 October 2026';
  page.drawText(joiningDateStr, {
    x: 238,
    y: 394,
    size: 11.5,
    font: fontBold,
    color: black,
  });

  // 6. Signatory (if custom signatory specified, overlay signatory name & title)
  if (offer.signatory_name && offer.signatory_name !== 'ANSH TIWARI') {
    page.drawRectangle({
      x: 70,
      y: 110,
      width: 250,
      height: 45,
      color: white,
    });
    page.drawText(offer.signatory_name.toUpperCase(), {
      x: 74,
      y: 138,
      size: 13,
      font: fontBold,
      color: black,
    });
    page.drawText((offer.signatory_title || 'FOUNDER').toUpperCase(), {
      x: 74,
      y: 124,
      size: 11,
      font: fontRegular,
      color: textDark,
    });
    page.drawText(offer.company_name || 'Go_Repireo', {
      x: 74,
      y: 110,
      size: 11,
      font: fontRegular,
      color: textDark,
    });
  }

  return await pdfDoc.save();
}
