import { NextResponse, type NextRequest } from 'next/server';

// Cookie name specific to Super Admin Dashboard
const AUTH_TOKEN_COOKIE = 'admin-auth-token';

/**
 * Middleware to protect dashboard routes
 * Checks for auth_token cookie and redirects to login if not present
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Check for auth token
  const authToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

  // Redirect to login if accessing protected route without token
  if (!isPublicPath && !authToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing login with valid token
  if (pathname === '/login' && authToken) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Redirect root to dashboard
  if (pathname === '/') {
    if (authToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
