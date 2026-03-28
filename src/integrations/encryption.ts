// ============================================================
// AES-256-GCM Encryption — Web Crypto API (Workers compatible)
// ============================================================
// Adapted from bwhockey/readysetrealign encryption patterns.
// Uses Web Crypto API for Cloudflare Workers compatibility.
// ============================================================

const IV_LENGTH = 12;
const TAG_LENGTH = 128;

/**
 * Encrypt a string using AES-256-GCM.
 * Returns format: enc:<base64(iv + ciphertext + authTag)>
 */
export async function encrypt(plaintext: string, keyBase64: string): Promise<string> {
  const key = await importKey(keyBase64);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: TAG_LENGTH },
    key,
    encoded
  );

  // Combine IV + ciphertext (which includes auth tag in Web Crypto)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return `enc:${btoa(String.fromCharCode(...combined))}`;
}

/**
 * Decrypt an enc:-prefixed string using AES-256-GCM.
 */
export async function decrypt(encrypted: string, keyBase64: string): Promise<string> {
  if (!encrypted.startsWith("enc:")) return encrypted; // Not encrypted

  const key = await importKey(keyBase64);
  const combined = Uint8Array.from(atob(encrypted.slice(4)), (c) => c.charCodeAt(0));

  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: TAG_LENGTH },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Check if a string is encrypted.
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith("enc:");
}

async function importKey(keyBase64: string): Promise<CryptoKey> {
  const keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}
