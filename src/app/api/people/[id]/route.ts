import { NextRequest, NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { getCurrentUser, canManagePeople } from '@/lib/auth';
import { personSchema } from '@/validators';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!canManagePeople(currentUser.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized to edit people' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Partial validation of person schema
    const validated = personSchema.partial().parse(body);

    const person = await DataService.updatePerson(id, validated, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return NextResponse.json({ success: true, person });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update person' },
      { status: 400 }
    );
  }
}
