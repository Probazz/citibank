import { NextRequest, NextResponse } from 'next/server';
import { isPreviewAccessTokenValid } from './lib/preview-access';

const UNLOCK_PATH = '/unlock';
const UNLOCK_API_PATH = '/api/unlock';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  if (
    pathname === UNLOCK_PATH ||
    pathname === UNLOCK_API_PATH ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/_next/static/') ||
    pathname === '/_next/image'
  ) {
    return NextResponse.next();
  }

  const accessCode = process.env.PREVIEW_ACCESS_CODE;
  const token = request.cookies.get('preview_unlocked')?.value;

  if (
    accessCode &&
    token &&
    (await isPreviewAccessTokenValid(token, accessCode))
  ) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(UNLOCK_PATH, request.url));
}

export const config = {
  matcher: ['/:path*'],
};
