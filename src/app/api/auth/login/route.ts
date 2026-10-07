import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json();

    // Clean corporate authentication flow
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const assignedRole = role || (email.includes('admin') ? 'ADMIN' : email.includes('manager') ? 'PEOPLE_MANAGER' : 'OWNER');
    const response = NextResponse.json({ success: true, redirect: '/dashboard' });

    // Set auth cookies
    response.cookies.set('gr_auth_session', `session_${Date.now()}`, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set('gr_user_email', email, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set('gr_user_role', assignedRole, {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 500 });
  }
}
