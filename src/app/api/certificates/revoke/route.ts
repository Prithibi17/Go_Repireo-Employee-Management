import { NextRequest, NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { getCurrentUser, canIssueCertificates } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!canIssueCertificates(currentUser.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { certificate_id, reason } = await request.json();
    if (!certificate_id) {
      return NextResponse.json({ success: false, error: 'certificate_id is required' }, { status: 400 });
    }

    const certificate = await DataService.revokeCertificate(
      certificate_id,
      reason || 'Administrative revocation',
      {
        id: currentUser.id,
        name: currentUser.full_name,
      }
    );

    return NextResponse.json({ success: true, certificate });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
