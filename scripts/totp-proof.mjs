// AccountStoreOne — RFC 6238 proof for src/lib/totp.ts (the exact module the
// buyer vault ships). Run: node scripts/totp-proof.mjs
import { base32Decode, totp, isValidBase32Secret } from "../src/lib/totp.ts";

let fails = 0;
const check = (name, got, want) => {
  const ok = got === want;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}: got=${got} want=${want}`);
  if (!ok) fails++;
};

// RFC 6238 Appendix B test secret: ASCII "12345678901234567890"
const ascii = "12345678901234567890";
const b32 = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
const decoded = base32Decode(b32);
check("base32 decodes to the RFC ASCII secret", decoded && new TextDecoder().decode(decoded), ascii);
check("base32 of the ASCII secret re-derives (known vector)", b32, "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
check("T=59s → 287082", await totp(b32, 59 * 1000), "287082");
check("T=1111111109s → 081804", await totp(b32, 1111111109 * 1000), "081804");
// More RFC 6238 vectors (SHA-1, 8-digit values truncated to 6)
check("T=1111111111s → 050471", await totp(b32, 1111111111 * 1000), "050471"); // RFC 8-digit: 89054711
check("T=1234567890s → 005924", await totp(b32, 1234567890 * 1000), "005924"); // RFC 8-digit: 89005924
check("lowercase + spaces tolerated", await totp("gezd gnbv gy3t qojq gezd gnbv gy3t qojq", 59 * 1000), "287082");
check("invalid secret → null", await totp("not!base32!!", 59 * 1000), null);
check("isValidBase32Secret(valid)", isValidBase32Secret(b32), true);
check("isValidBase32Secret(garbage)", isValidBase32Secret("hello world!"), false);
process.exit(fails ? 1 : 0);
