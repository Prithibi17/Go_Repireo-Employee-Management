import { NextRequest, NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { getCurrentUser, canManagePeople } from '@/lib/auth';
import { completeInternshipSchema } from '@/validators';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!canManagePeople(currentUser.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validated = completeInternshipSchema.parse(body);

    const internship = await DataService.completeInternship({
      internshipId: validated.internship_id,
      finalEndDate: validated.final_end_date,
      completionNotes: validated.completion_notes,
      deactivateIdCard: validated.deactivate_id_card,
      actor: {
        id: currentUser.id,
        name: currentUser.full_name,
      },
    });

    return NextResponse.json({ success: true, internship });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
