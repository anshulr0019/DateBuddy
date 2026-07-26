import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/home', '/discover', '/matches', '/messages', '/profile', '/meetups'];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // If user is accessing protected page without auth token, redirect to /welcome
  if (isProtectedRoute && !token) {
    const welcomeUrl = new URL('/welcome', request.url);
    return NextResponse.redirect(welcomeUrl);
  }

  // If user is logged in and visits /welcome or /, redirect to /discover
  if (token && (pathname === '/welcome' || pathname === '/')) {
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
  ],
};
