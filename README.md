# AccountStoreOne

A single-seller digital goods storefront — Next.js 15 on **Prisma + Neon
Postgres** with **Neon Auth** for accounts. Customers pay by card (Stripe)
or from their in-store wallet; purchased credentials are delivered from
inventory with a 48-hour escrow window.

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in the values.
3. Generate the Prisma client: `npx prisma generate`
4. Run the app: `npm run dev`

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string (Prisma, pooled) |
| `DATABASE_URL_UNPOOLED` | Neon Postgres connection string (direct, for migrations) |
| `NEON_AUTH_BASE_URL` | Neon Auth endpoint (from the Neon console) |
| `NEON_AUTH_JWKS_URL` | Neon Auth JWKS URL (session verification) |
| `NEXT_PUBLIC_SITE_URL` | Canonical public URL of the store |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Optional environment fallback for card checkout. The primary path is the admin dashboard (Settings → Payments), where the same credentials are stored write-only in the DB; a method only shows as enabled when real credentials exist — nothing is faked. |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | Optional environment fallback for PayPal credentials (also manageable from Settings → Payments; the PayPal checkout flow is not connected yet, so PayPal is never offered to buyers). |
| `RESEND_API_KEY` | Transactional email (order + delivery notifications) |
| `FIRST_ADMIN_EMAIL` (+ `FIRST_ADMIN_PASSWORD`, `FIRST_ADMIN_NAME`) | First-admin bootstrap, see below |

## First admin (one-time)

```
FIRST_ADMIN_EMAIL=owner@example.com FIRST_ADMIN_PASSWORD='…' FIRST_ADMIN_NAME='Owner' \
  node --env-file=.env.local scripts/seed-admin.mjs
```

Then sign in at `/login` and open `/admin`. Roles are enforced server-side
(admin layout + every API route); there is no self-serve way to become admin.

## How money moves

- Orders start **unpaid** and are paid by card (Stripe) or from the store
  wallet. The store is international-only: there are no Bangladeshi/manual
  gateways — the manual submission endpoints are closed (410) and the
  **Admin → Payment Verification** queue only reviews legacy submissions.
  Wallet payments and refunds are transactional and written to the
  `wallet_transactions` ledger.
- Escrow: a paid order's funds stay "in escrow" until the buyer confirms
  receipt, an admin completes the order, or 48h pass after delivery.
  Disputes freeze escrow; resolution = refund-to-wallet or replacement.
- `orders.total_price` is the ONE canonical amount (price × qty + $0.50 fee).

## Deploy

`vercel.json` pins `framework: nextjs`. Push to `main` → Vercel
auto-deploys. Uploads currently write to `public/uploads` on the local
filesystem (a Blob-backed adapter is the production upgrade path).
