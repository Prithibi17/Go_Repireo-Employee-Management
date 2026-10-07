import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  const response = NextResponse.redirect(loginUrl);

  response.cookies.delete('gr_auth_session');
  response.cookies.delete('gr_user_email');
  response.cookies.delete('gr_user_role');

  return response;
}
