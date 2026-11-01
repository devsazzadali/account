// AccountStoreOne — runtime serving for uploaded files.
// /api/upload writes files under public/uploads/<bucket>/, but the
// production server's static public-file handler only serves files
// that existed when the process started — a file uploaded a second
// ago would 404 until a restart. This route handler is the fallthrough
// for those runtime files: it reads the same directory from disk.
// (On Vercel the disk is ephemeral either way — see the production
// note in /api/upload: Vercel Blob is the launch swap, same contract.)

import { readFile } from "node:fs/promises";
import path from "node:path";

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bucket: string; name: string }> },
) {
  const { bucket, name } = await params;
  if (!/^[a-z0-9_-]{1,32}$/i.test(bucket)) return new Response("Not found", { status: 404 });
  if (!name || name.includes("/") || name.includes("\\") || name.includes("..")) {
    return new Response("Not found", { status: 404 });
  }
  const type = TYPES[path.extname(name).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });
  try {
    const bytes = await readFile(path.join(process.cwd(), "public", "uploads", bucket, name));
    return new Response(bytes, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
