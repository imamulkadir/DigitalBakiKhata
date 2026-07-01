import { create, verify, type Payload } from 'https://deno.land/x/djwt@v2.9.1/mod.ts';

// Custom auth issues its own JWTs for `profiles` rows (there is no matching
// auth.users row), so GoTrue's /auth/v1/user cannot verify them. We sign and
// verify with our own shared secret instead.
async function getSigningKey(): Promise<CryptoKey> {
  const jwtSecret = Deno.env.get('JWT_SIGNING_SECRET')!;
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(jwtSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSessionToken(payload: Payload): Promise<string> {
  const key = await getSigningKey();
  return create({ alg: 'HS256', typ: 'JWT' }, payload, key);
}

export async function verifySessionToken(token: string): Promise<Payload> {
  const key = await getSigningKey();
  return verify(token, key);
}
