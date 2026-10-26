<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/1d9b2161-8e9a-4b89-93c6-4102bb96458a

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

## AccountStoreOne — operations (completion build)

The app is a Next.js 15 storefront on **Prisma + Neon Postgres** with
**Neon Auth** for accounts. There is no Supabase dependency anymore.

### Environment (.env.local / Vercel env)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string (Prisma) |
| `NEON_AUTH_BASE_URL` | Neon Auth endpoint (from `neon.ts` / Neon console) |
| `NEON_AUTH_JWKS_URL` | Neon Auth JWKS URL (session verification) |
| `STORE_BKASH_NUMBER` / `STORE_NAGAD_NUMBER` | Fallback manual-payment numbers (the admin Settings page can override them in the DB) |
| `STORE_PAYMENT_INSTRUCTIONS` | Optional checkout instructions text |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Enable card checkout. Without them the Stripe option shows "not configured" and nothing is faked. |
| `FIRST_ADMIN_EMAIL` (+ `FIRST_ADMIN_PASSWORD`, `FIRST_ADMIN_NAME`) | First-admin bootstrap, see below |

### First admin (one-time)

```
FIRST_ADMIN_EMAIL=owner@example.com FIRST_ADMIN_PASSWORD='…' FIRST_ADMIN_NAME='Owner' \
  node --env-file=.env.local scripts/seed-admin.mjs
```

Then sign in at `/login` and open `/admin`. Roles are enforced server-side
(admin layout + every API route); there is no self-serve way to become admin.

### How money moves

- Orders start **unpaid**. Manual bKash/Nagad payments are verified by an
  admin in **Admin → Payment Verification**; approval marks the order paid
  and auto-delivers from inventory when stock exists. Wallet payments and
  refunds are transactional and written to the `wallet_transactions` ledger.
- Escrow: a paid order's funds stay "in escrow" until the buyer confirms
  receipt, an admin completes the order, or 48h pass after delivery.
  Disputes freeze escrow; resolution = refund-to-wallet or replacement.
- `orders.total_price` is the ONE canonical amount (price × qty + $0.50 fee).

### Deploy

`vercel.json` pins `framework: nextjs` (the Oct 2026 deploy failure was the
project still expecting a Vite `dist` output). Push to `main` → Vercel
auto-deploys. Uploads currently write to `public/uploads` on the local
filesystem (see COMPLETION_REPORT.md for the production Blob note).
