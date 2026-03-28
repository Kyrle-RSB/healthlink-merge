// ============================================================
// Zoom Webhook — CRC challenge-response + HMAC verification
// ============================================================

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const data = new TextEncoder().encode(message);
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function handleCrcChallenge(
  plainToken: string,
  secretToken: string
): Promise<{ plainToken: string; encryptedToken: string }> {
  const encryptedToken = await hmacHex(secretToken, plainToken);
  return { plainToken, encryptedToken };
}

export async function verifyWebhookSignature(
  signature: string,
  timestamp: string,
  rawBody: string,
  secretToken: string
): Promise<boolean> {
  const tsMs = Number(timestamp) * 1000;
  if (Number.isNaN(tsMs) || Math.abs(Date.now() - tsMs) > TIMESTAMP_TOLERANCE_MS) return false;

  const message = `v0:${timestamp}:${rawBody}`;
  const expectedHash = await hmacHex(secretToken, message);
  return signature === `v0=${expectedHash}`;
}
