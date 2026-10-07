import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public verification routes without auth
  if (pathname.startsWith('/verify')) {
    return NextResponse.next();
  }

  // 2. Allow static files, api routes, icons, public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/gorepireo-') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 3. Login page
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // 4. Check for session cookie
  const sessionToken = request.cookies.get('gr_auth_session')?.value;
  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
