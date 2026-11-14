export const PREVIEW_ACCESS_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

const TOKEN_PREFIX = 'preview_unlocked';

export async function createPreviewAccessToken(
  secret: string,
  issuedAt = Math.floor(Date.now() / 1000),
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const message = new TextEncoder().encode(`${TOKEN_PREFIX}:${issuedAt}`);
  const signature = await crypto.subtle.sign('HMAC', key, message);
  const encodedSignature = Array.from(new Uint8Array(signature), (byte) =>
    String.fromCharCode(byte),
  ).join('');
  const encodedToken = btoa(encodedSignature)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `${issuedAt}.${encodedToken}`;
}

export async function isPreviewAccessTokenValid(
  token: string,
  secret: string,
  now = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  const [issuedAtValue, encodedSignature, ...extraParts] = token.split('.');
  if (
    extraParts.length > 0 ||
    !/^\d+$/.test(issuedAtValue) ||
    !encodedSignature
  ) {
    return false;
  }

  const issuedAt = Number(issuedAtValue);
  if (
    !Number.isSafeInteger(issuedAt) ||
    issuedAt > now + 60 ||
    now - issuedAt > PREVIEW_ACCESS_MAX_AGE_SECONDS
  ) {
    return false;
  }

  const base64Signature = encodedSignature
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  let signature: ArrayBuffer;
  try {
    const paddedSignature = base64Signature.padEnd(
      Math.ceil(base64Signature.length / 4) * 4,
      '=',
    );
    const decodedSignature = atob(paddedSignature);
    signature = new ArrayBuffer(decodedSignature.length);
    const signatureBytes = new Uint8Array(signature);
    for (let index = 0; index < decodedSignature.length; index += 1) {
      signatureBytes[index] = decodedSignature.charCodeAt(index);
    }
  } catch {
    return false;
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const message = new TextEncoder().encode(
    `${TOKEN_PREFIX}:${issuedAtValue}`,
  );

  return crypto.subtle.verify('HMAC', key, signature, message);
}
