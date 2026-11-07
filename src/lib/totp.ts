/* RFC 6238 TOTP (HMAC-SHA1, 6 digits, 30-second step) implemented with WebCrypto.
 * No dependencies. Verified against the RFC 6238 appendix B test vectors in tests/totp.test.ts. */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      output += BASE32_ALPHABET[(value >>> bits) & 31];
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >>> bits) & 255);
    }
  }
  return new Uint8Array(out);
}

export function generateTotpSecret(): string {
  const bytes = new Uint8Array(20);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return base32Encode(bytes);
}

async function hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data as unknown as ArrayBuffer);
  return new Uint8Array(signature);
}

export async function totpAt(secretBase32: string, unixSeconds: number): Promise<string> {
  const step = Math.floor(unixSeconds / 30);
  const counter = new Uint8Array(8);
  let remaining = step;
  for (let i = 7; i >= 0; i--) {
    counter[i] = remaining & 0xff;
    remaining = Math.floor(remaining / 256);
  }
  const digest = await hmacSha1(base32Decode(secretBase32), counter);
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

/* Verifies a 6-digit code, allowing one 30-second step of clock drift either side. */
export async function verifyTotp(secretBase32: string, code: string, at: number = Date.now()): Promise<boolean> {
  const cleaned = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  const now = Math.floor(at / 1000);
  for (const drift of [-1, 0, 1]) {
    if ((await totpAt(secretBase32, now + drift * 30)) === cleaned) return true;
  }
  return false;
}

export function otpauthUri(secretBase32: string, account: string, issuer = "KR8 Academy"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

export function generateRecoveryCodes(count = 8): string[] {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const codes: string[] = [];
  const bytes = new Uint8Array(count * 10);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  for (let i = 0; i < count; i++) {
    let code = "";
    for (let j = 0; j < 10; j++) code += alphabet[bytes[i * 10 + j] % alphabet.length];
    codes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
  }
  return codes;
}
