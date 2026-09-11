import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/forgot-password/verify',
  '/forgot-password/reset',
  '/forgot-password/success',
  '/signup/verify',
  '/signup/success',
  '/invite',
  '/auth/error',
  '/unauthorized',
];

const isPublicRoute = (path: string): boolean => {
  return publicRoutes.some(route => path.startsWith(route));
};

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/$/, '') || '/';

  const rawToken = request.cookies.get('access_token')?.value;
  const accessToken = rawToken ? decodeURIComponent(rawToken) : undefined;
  const isAuthenticated = Boolean(accessToken);

  // If user is authenticated and tries to access auth pages
  if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow public routes for unauthenticated users
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Protect all other routes
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude API routes (proxied to the backend through next.config rewrites,
    // where auth is enforced), static assets and well-known files.
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|.*\\.well-known.*).*)',
  ],
};