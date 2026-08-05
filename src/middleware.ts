import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/session-token';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname, searchParams } = request.nextUrl;

  const protectedRoutes = ['/home', '/discover', '/matches', '/messages', '/profile', '/meetups', '/settings', '/chat'];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isOnboarding = pathname.startsWith('/onboarding');
  const isSwitchingAccount = searchParams.has('switch') || searchParams.has('logout');
  // OAuth failures land on /welcome?error=... — never bounce those to /discover,
  // or a stale session cookie silently hides the failure.
  const hasAuthError = searchParams.has('error');

  const session = token ? await verifyAuthToken(token) : null;

  // If user is accessing protected page without auth token, redirect to /welcome
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/welcome', request.url));
  }

  // A signed-in user who never finished onboarding would otherwise enter the
  // dating pool as a placeholder profile ("New User", no photos).
  if (isProtectedRoute && session && !session.onboardingComplete) {
    return NextResponse.redirect(new URL('/onboarding/basic-info', request.url));
  }

  if (isOnboarding && !session) {
    return NextResponse.redirect(new URL('/welcome', request.url));
  }

  // If user is logged in and visits /welcome without switch parameter, redirect onward.
  // "/" is deliberately excluded: the launch splash always plays there and routes onward itself.
  if (session && pathname === '/welcome' && !isSwitchingAccount && !hasAuthError) {
    const destination = session.onboardingComplete ? '/discover' : '/onboarding/basic-info';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/welcome',
    '/onboarding/:path*',
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
