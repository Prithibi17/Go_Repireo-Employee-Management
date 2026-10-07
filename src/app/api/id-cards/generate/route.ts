import { NextRequest, NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { getCurrentUser, canManagePeople } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!canManagePeople(currentUser.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized to generate ID cards' }, { status: 403 });
    }

    const { person_id } = await request.json();
    if (!person_id) {
      return NextResponse.json({ success: false, error: 'person_id is required' }, { status: 400 });
    }

    const idCard = await DataService.generateIdCard(person_id, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return NextResponse.json({ success: true, idCard });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
