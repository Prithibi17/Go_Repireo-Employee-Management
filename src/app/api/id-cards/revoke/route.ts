import { NextRequest, NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { getCurrentUser, canManagePeople } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!canManagePeople(currentUser.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized to revoke ID cards' }, { status: 403 });
    }

    const { card_id, reason } = await request.json();
    if (!card_id) {
      return NextResponse.json({ success: false, error: 'card_id is required' }, { status: 400 });
    }

    const idCard = await DataService.revokeIdCard(card_id, reason || 'Revoked by admin', {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return NextResponse.json({ success: true, idCard });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
