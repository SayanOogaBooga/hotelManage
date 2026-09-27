import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the user is trying to access the dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Look for the auth cookie
    const isAuthenticated = request.cookies.has('auth');

    // If not authenticated, redirect to the login page
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // If they are on the login page but ALREADY authenticated, redirect them to dashboard
  if (request.nextUrl.pathname === '/') {
    const isAuthenticated = request.cookies.has('auth');
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};
