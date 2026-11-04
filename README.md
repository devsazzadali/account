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
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Enable card checkout. Without them the Stripe option shows "not configured" and nothing is faked. |
| `RESEND_API_KEY` | Transactional email (order + delivery notifications) |
| `STORE_BKASH_NUMBER` / `STORE_NAGAD_NUMBER` | Fallback manual-payment numbers (the admin Settings page can override them in the DB) |
| `STORE_PAYMENT_INSTRUCTIONS` | Optional checkout instructions text |
| `FIRST_ADMIN_EMAIL` (+ `FIRST_ADMIN_PASSWORD`, `FIRST_ADMIN_NAME`) | First-admin bootstrap, see below |

## First admin (one-time)

```
FIRST_ADMIN_EMAIL=owner@example.com FIRST_ADMIN_PASSWORD='…' FIRST_ADMIN_NAME='Owner' \
  node --env-file=.env.local scripts/seed-admin.mjs
```

Then sign in at `/login` and open `/admin`. Roles are enforced server-side
(admin layout + every API route); there is no self-serve way to become admin.

## How money moves

- Orders start **unpaid**. Manual bKash/Nagad payments are verified by an
  admin in **Admin → Payment Verification**; approval marks the order paid
  and auto-delivers from inventory when stock exists. Wallet payments and
  refunds are transactional and written to the `wallet_transactions` ledger.
- Escrow: a paid order's funds stay "in escrow" until the buyer confirms
  receipt, an admin completes the order, or 48h pass after delivery.
  Disputes freeze escrow; resolution = refund-to-wallet or replacement.
- `orders.total_price` is the ONE canonical amount (price × qty + $0.50 fee).

## Deploy

`vercel.json` pins `framework: nextjs`. Push to `main` → Vercel
auto-deploys. Uploads currently write to `public/uploads` on the local
filesystem (a Blob-backed adapter is the production upgrade path).
