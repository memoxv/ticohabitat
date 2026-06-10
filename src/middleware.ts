import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_FILE_PATTERN = /\.(.*)$/;
const LOCALES = ['es', 'en'];
const DEFAULT_LOCALE = 'es';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude API routes, next internal routes, and static assets
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/regions') ||
    pathname.includes('.well-known') ||
    PUBLIC_FILE_PATTERN.test(pathname) ||
    ['/manifest.json', '/sw.js', '/favicon.ico'].includes(pathname)
  ) {
    return NextResponse.next();
  }

  // Check if pathname has a supported locale
  const pathnameHasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    // If it already has a locale, check if the cookie matches
    const pathLocale = pathname.split('/')[1];
    const cookieLocale = request.cookies.get('language')?.value;
    
    const response = NextResponse.next();
    if (cookieLocale !== pathLocale) {
      // Sync cookie with the URL locale
      response.cookies.set('language', pathLocale, { path: '/', maxAge: 31536000, sameSite: 'lax' });
    }
    return response;
  }

  // Determine locale: Cookie -> Accept-Language header -> Default
  let locale = request.cookies.get('language')?.value;
  if (!locale || !LOCALES.includes(locale)) {
    const acceptLanguage = request.headers.get('accept-language') || '';
    locale = acceptLanguage.toLowerCase().startsWith('en') ? 'en' : 'es';
  }

  // Redirect to localized path
  const redirectUrl = new URL(
    `/${locale}${pathname}${request.nextUrl.search}`,
    request.url
  );
  
  const response = NextResponse.redirect(redirectUrl);
  // Also store it in cookie
  response.cookies.set('language', locale, { path: '/', maxAge: 31536000, sameSite: 'lax' });
  return response;
}

export const config = {
  matcher: [
    // Match all paths except internal files and specific public endpoints
    '/((?!_next|api|favicon.ico|manifest.json|sw.js|logo|regions|.*\\.).*)',
  ],
};
