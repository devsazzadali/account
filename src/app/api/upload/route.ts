// AccountStoreOne — file uploads (avatars, product images, message files).
// LOCAL STORAGE: files are written under public/uploads/<bucket>/ and served
// as static assets. This proves the full upload flow on the local server.
// ⚠️ PRODUCTION CHOICE (documented in COMPLETION_REPORT.md): Vercel's
// filesystem is ephemeral, so before/at launch this route should be swapped
// for Vercel Blob (same request/response contract).

import { getSessionContext, unauthorized } from "@/src/lib/auth-server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf", "text/plain"]);

export async function POST(req: Request) {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const bucket = String(form?.get("bucket") || "misc").replace(/[^a-z0-9_-]/gi, "").slice(0, 32) || "misc";
  if (!(file instanceof File)) return Response.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "File is larger than 5 MB" }, { status: 413 });
  if (!ALLOWED.has(file.type)) return Response.json({ error: `File type ${file.type || "unknown"} is not allowed` }, { status: 415 });

  const ext = path.extname(file.name).replace(/[^a-z0-9.]/gi, "").slice(0, 10) || ".bin";
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", bucket);
  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), bytes);
  return Response.json({ url: `/uploads/${bucket}/${name}` }, { status: 201 });
}
