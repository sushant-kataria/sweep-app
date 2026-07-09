import { createHmac, timingSafeEqual } from 'crypto';
import type { User } from '@workos-inc/node';

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const TOKEN_PREFIX = 'swp1';

function signingSecret(): string {
  const secret =
    process.env.SWEEP_MOBILE_TOKEN_SECRET ||
    process.env.WORKOS_COOKIE_PASSWORD ||
    process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('Missing SWEEP_MOBILE_TOKEN_SECRET (or WORKOS_COOKIE_PASSWORD) for mobile auth');
  }
  return secret;
}

type MobileTokenPayload = {
  sub: string;
  email: string;
  exp: number;
  iat: number;
};

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64url');
}

function sign(payloadB64: string): string {
  return createHmac('sha256', signingSecret()).update(payloadB64).digest('base64url');
}

export function createMobileAccessToken(user: Pick<User, 'id' | 'email'>): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: MobileTokenPayload = {
    sub: user.id,
    email: user.email,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };
  const payloadB64 = b64url(JSON.stringify(payload));
  const sig = sign(payloadB64);
  return `${TOKEN_PREFIX}.${payloadB64}.${sig}`;
}

export function verifyMobileAccessToken(token: string): MobileTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) return null;
    const [, payloadB64, sig] = parts;
    const expected = sign(payloadB64);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as MobileTokenPayload;
    if (!payload?.sub || !payload?.email || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Minimal User-shaped object for API auth checks. */
export function mobileUserFromToken(token: string): User | null {
  const payload = verifyMobileAccessToken(token);
  if (!payload) return null;
  return {
    id: payload.sub,
    email: payload.email,
    emailVerified: true,
    profilePictureUrl: null,
    firstName: null,
    lastName: null,
    lastSignInAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    externalId: null,
    metadata: {},
  } as User;
}
