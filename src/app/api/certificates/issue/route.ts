import { NextRequest, NextResponse } from 'next/server';
import { DataService } from '@/services/dataService';
import { getCurrentUser, canIssueCertificates } from '@/lib/auth';
import { issueCertificateSchema } from '@/validators';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!canIssueCertificates(currentUser.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only Admin or Owner can issue certificates' }, { status: 403 });
    }

    const body = await request.json();
    const validated = issueCertificateSchema.parse(body);

    const certificate = await DataService.issueCertificate({
      personId: validated.person_id,
      internshipId: validated.internship_id,
      recipientName: validated.recipient_name,
      role: validated.role,
      department: validated.department,
      domain: validated.domain,
      project: validated.project,
      startDate: validated.start_date,
      endDate: validated.end_date,
      issueDate: validated.issue_date,
      signatoryName: validated.signatory_name,
      signatoryDesignation: validated.signatory_designation,
      actor: {
        id: currentUser.id,
        name: currentUser.full_name,
      },
    });

    return NextResponse.json({ success: true, certificate });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
