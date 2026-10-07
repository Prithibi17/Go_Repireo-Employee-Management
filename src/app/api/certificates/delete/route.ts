import { NextRequest, NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { getCurrentUser, canIssueCertificates } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!canIssueCertificates(currentUser.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only Owner or Admin can delete certificates' }, { status: 403 });
    }

    const { certificate_id } = await request.json();
    if (!certificate_id) {
      return NextResponse.json({ success: false, error: 'certificate_id is required' }, { status: 400 });
    }

    const result = await DataService.deleteCertificate(
      certificate_id,
      {
        id: currentUser.id,
        name: currentUser.full_name,
      }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
