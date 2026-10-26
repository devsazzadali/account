// AccountStoreOne — RFC 4226 HOTP / RFC 6238 TOTP, hand-rolled.
// No external dependency: base32 (RFC 4648) decoding + HMAC-SHA1 via
// WebCrypto (available in browsers and Node 19+). Used by the buyer's
// credential vault to render a LIVE authenticator code from the delivered
// account's stored 2FA secret, and by the verification script that proves
// this implementation against the RFC 6238 test vectors.
//
// NOTE: keep this file free of non-erasable TypeScript syntax (no enums,
// namespaces or parameter properties) so Node's type-stripping can import
// it directly in test scripts.

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Decode a base32 (RFC 4648) secret. Tolerates spaces, dashes, lowercase
 *  and missing padding. Returns null for anything that is not valid base32. */
export function base32Decode(input: string): Uint8Array | null {
  if (typeof input !== "string") return null;
  const clean = input.replace(/[\s-]/g, "").replace(/=+$/, "").toUpperCase();
  if (clean.length === 0) return null;
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) return null;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >>> bits) & 0xff);
    }
  }
  if (out.length === 0) return null;
  return new Uint8Array(out);
}

export function isValidBase32Secret(input: string | null | undefined): boolean {
  if (!input) return false;
  const bytes = base32Decode(input);
  return !!bytes && bytes.length >= 4; // real-world secrets are ≥10 bytes; 4 is a sane floor
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, message as unknown as BufferSource);
  return new Uint8Array(sig);
}

/** RFC 4226 HOTP: HMAC-SHA1 over the 8-byte big-endian counter, dynamic
 *  truncation, `digits` decimal digits (zero-padded). */
export async function hotp(secret: Uint8Array, counter: number, digits = 6): Promise<string> {
  const msg = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    msg[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const hash = await hmacSha1(secret, msg);
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  const mod = binary % 10 ** digits;
  return mod.toString().padStart(digits, "0");
}

/** RFC 6238 TOTP for a base32 secret at a point in time.
 *  Returns null when the secret is not valid base32. */
export async function totp(
  secretBase32: string,
  timeMs: number = Date.now(),
  periodSeconds = 30,
  digits = 6,
): Promise<string | null> {
  const secret = base32Decode(secretBase32);
  if (!secret) return null;
  const counter = Math.floor(timeMs / 1000 / periodSeconds);
  return hotp(secret, counter, digits);
}

/** Seconds left before the current code rolls over. */
export function totpSecondsRemaining(timeMs: number = Date.now(), periodSeconds = 30): number {
  const elapsed = Math.floor(timeMs / 1000) % periodSeconds;
  return periodSeconds - elapsed;
}
