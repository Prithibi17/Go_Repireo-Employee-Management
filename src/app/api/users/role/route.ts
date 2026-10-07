import { NextRequest, NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { getCurrentUser, canManageUsers } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!canManageUsers(currentUser.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only Owner can manage roles' }, { status: 403 });
    }

    const { profile_id, role } = await request.json();
    if (!profile_id || !role) {
      return NextResponse.json({ success: false, error: 'Missing profile_id or role' }, { status: 400 });
    }

    const updated = await DataService.updateProfileRole(profile_id, role, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
