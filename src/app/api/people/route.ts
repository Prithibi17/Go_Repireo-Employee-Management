import { NextRequest, NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { getCurrentUser, canManagePeople } from '@/lib/auth';
import { personSchema } from '@/validators';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || undefined;
  const dept = searchParams.get('dept') || undefined;
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;

  const people = await DataService.getPeople({
    type,
    departmentId: dept,
    status,
    search,
  });

  return NextResponse.json({ success: true, people });
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!canManagePeople(currentUser.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized to add people' }, { status: 403 });
    }

    const body = await request.json();
    const validated = personSchema.parse(body);

    const person = await DataService.createPerson(validated, {
      id: currentUser.id,
      name: currentUser.full_name,
    });

    return NextResponse.json({ success: true, person });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create person' },
      { status: 400 }
    );
  }
}
