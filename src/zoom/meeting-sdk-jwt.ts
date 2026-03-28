// ============================================================
// Meeting SDK JWT — HMAC-SHA256 via Web Crypto API (Workers)
// ============================================================

function base64url(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function generateMeetingSdkJwt(
  clientId: string,
  clientSecret: string,
  meetingNumber: number,
  role: 0 | 1,
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000) - 30;
  const exp = iat + 7200;

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({ appKey: clientId, mn: meetingNumber, role, iat, exp, tokenExp: exp })
  );

  const message = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(clientSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  const signature = base64url(new Uint8Array(sig));

  return `${message}.${signature}`;
}
