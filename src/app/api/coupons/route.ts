// AccountStoreOne — coupons (Z2U alignment P5), admin management.
// GET    /api/coupons            → all coupons (admin)
// POST   /api/coupons            → create (admin)
// PATCH  /api/coupons { id, … }  → update fields incl. is_active (admin)
// DELETE /api/coupons?id=…       → delete (admin)
// Redemption itself is validated + priced server-side in order-service.

import { requireAdmin, isResponse } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import { serializeRow, serializeRows } from "@/src/lib/serialize";

function normCode(v: unknown): string {
  return String(v || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  const rows = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({ coupons: serializeRows(rows as unknown as Record<string, unknown>[]) });
}

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  const body = await req.json().catch(() => ({}));
  const code = normCode(body.code);
  if (code.length < 3) return Response.json({ error: "Coupon code must be at least 3 characters" }, { status: 422 });
  const type = body.type === "fixed" ? "fixed" : "percent";
  const value = Number(body.value);
  if (!Number.isFinite(value) || value <= 0) return Response.json({ error: "Discount value must be greater than zero" }, { status: 422 });
  if (type === "percent" && value > 100) return Response.json({ error: "Percent discount cannot exceed 100" }, { status: 422 });
  const scope = ["product", "category"].includes(body.scope) ? body.scope : "store";
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) return Response.json({ error: "A coupon with this code already exists" }, { status: 409 });
  const row = await prisma.coupon.create({
    data: {
      code,
      type,
      value,
      scope,
      productId: scope === "product" ? String(body.product_id || body.productId || "") || null : null,
      category: scope === "category" ? String(body.category || "") || null : null,
      minSpend: body.min_spend != null && body.min_spend !== "" ? Number(body.min_spend) : null,
      maxUses: body.max_uses != null && body.max_uses !== "" ? Math.max(1, Math.floor(Number(body.max_uses))) : null,
      perUserLimit: Math.max(1, Math.floor(Number(body.per_user_limit || body.perUserLimit || 1))),
      isPublic: body.is_public !== false,
      expiresAt: body.expires_at ? new Date(body.expires_at) : null,
    },
  });
  return Response.json({ coupon: serializeRow(row as unknown as Record<string, unknown>) }, { status: 201 });
}

const EDITABLE: Record<string, string> = {
  type: "type",
  scope: "scope",
  category: "category",
  is_public: "isPublic",
  is_active: "isActive",
};

export async function PATCH(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return Response.json({ error: "id required" }, { status: 422 });
  const data: Record<string, unknown> = {};
  for (const [snake, camel] of Object.entries(EDITABLE)) {
    if (body[snake] !== undefined) data[camel] = body[snake];
    if (body[camel] !== undefined) data[camel] = body[camel];
  }
  if (body.value !== undefined) data.value = Number(body.value);
  if (body.product_id !== undefined || body.productId !== undefined) data.productId = String(body.product_id ?? body.productId) || null;
  if (body.min_spend !== undefined) data.minSpend = body.min_spend === null || body.min_spend === "" ? null : Number(body.min_spend);
  if (body.max_uses !== undefined) data.maxUses = body.max_uses === null || body.max_uses === "" ? null : Math.max(1, Math.floor(Number(body.max_uses)));
  if (body.per_user_limit !== undefined) data.perUserLimit = Math.max(1, Math.floor(Number(body.per_user_limit)));
  if (body.expires_at !== undefined) data.expiresAt = body.expires_at ? new Date(body.expires_at) : null;
  const row = await prisma.coupon.update({ where: { id }, data });
  return Response.json({ coupon: serializeRow(row as unknown as Record<string, unknown>) });
}

export async function DELETE(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return Response.json({ error: "id required" }, { status: 422 });
  await prisma.coupon.delete({ where: { id } });
  return Response.json({ ok: true });
}
