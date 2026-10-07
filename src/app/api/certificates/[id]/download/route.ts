import { NextRequest, NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { generateOfficialCertificatePdf } from '@/services/pdfCertificateService';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const certificate = await DataService.getCertificateById(id);

    if (!certificate) {
      return new NextResponse('Certificate not found', { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const pdfBytes = await generateOfficialCertificatePdf(certificate, appUrl);

    const filename = `GoRepireo_Certificate_${certificate.person_code_snapshot || certificate.certificate_number}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('PDF generation error', error);
    return new NextResponse('Failed to generate PDF', { status: 500 });
  }
}
