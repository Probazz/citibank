import { createHash, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  createPreviewAccessToken,
  PREVIEW_ACCESS_MAX_AGE_SECONDS,
} from '@/lib/preview-access';

const COOKIE_NAME = 'preview_unlocked';
const MAX_ACCESS_CODE_LENGTH = 256;

function redirectToUnlock(request: NextRequest, error: string) {
  return NextResponse.redirect(
    new URL(`/unlock?error=${error}`, request.url),
    303,
  );
}

export async function POST(request: NextRequest) {
  const accessCode = process.env.PREVIEW_ACCESS_CODE;
  if (!accessCode) {
    return redirectToUnlock(request, 'unconfigured');
  }

  let submittedCode: FormDataEntryValue | null;
  try {
    submittedCode = (await request.formData()).get('accessCode');
  } catch {
    return redirectToUnlock(request, 'invalid_request');
  }

  if (
    typeof submittedCode !== 'string' ||
    submittedCode.length > MAX_ACCESS_CODE_LENGTH
  ) {
    return redirectToUnlock(request, 'invalid');
  }

  const expectedDigest = createHash('sha256').update(accessCode).digest();
  const submittedDigest = createHash('sha256').update(submittedCode).digest();

  if (!timingSafeEqual(expectedDigest, submittedDigest)) {
    return redirectToUnlock(request, 'invalid');
  }

  const token = await createPreviewAccessToken(accessCode);
  const response = NextResponse.redirect(new URL('/', request.url), 303);
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: PREVIEW_ACCESS_MAX_AGE_SECONDS,
  });

  return response;
}
