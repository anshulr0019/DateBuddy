import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname, searchParams } = request.nextUrl;

  const protectedRoutes = ['/home', '/discover', '/matches', '/messages', '/profile', '/meetups', '/settings', '/chat'];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isSwitchingAccount = searchParams.has('switch') || searchParams.has('logout');

  // If user is accessing protected page without auth token, redirect to /welcome
  if (isProtectedRoute && !token) {
    const welcomeUrl = new URL('/welcome', request.url);
    return NextResponse.redirect(welcomeUrl);
  }

  // If user is logged in and visits /welcome without switch parameter, redirect to /discover.
  // "/" is deliberately excluded: the launch splash always plays there and routes onward itself.
  if (token && pathname === '/welcome' && !isSwitchingAccount) {
    const discoverUrl = new URL('/discover', request.url);
    return NextResponse.redirect(discoverUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/welcome',
    '/home/:path*',
    '/discover/:path*',
    '/matches/:path*',
    '/messages/:path*',
    '/profile/:path*',
    '/meetups/:path*',
    '/settings/:path*',
    '/chat/:path*',
  ],
};
