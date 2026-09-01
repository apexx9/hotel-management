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

  console.log('=== Proxy Debug ===');
  console.log('Pathname:', pathname);
  console.log('Has token:', !!accessToken);
  console.log('Is authenticated:', isAuthenticated);
  console.log('Is public route:', isPublicRoute(pathname));

  // If user is authenticated and tries to access auth pages
  if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
    console.log('✅ Authenticated user accessing auth page - redirecting to /dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow public routes for unauthenticated users
  if (isPublicRoute(pathname)) {
    console.log('✅ Public route - allowing access');
    return NextResponse.next();
  }

  // Protect all other routes
  if (!isAuthenticated) {
    console.log('❌ Unauthenticated user accessing protected route - redirecting to /login');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  console.log('✅ Authenticated user accessing protected route - allowing access');
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|.*\\.well-known.*).*)',
  ],
};
