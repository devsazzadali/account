# Marketplace Migration Plan: React (Vite) to Next.js 15 (App Router)

## 🏗️ 1. Architecture & Folder Structure
We are moving from a Client-Side Rendered (CSR) architecture to a Hybrid (Server/Client) architecture using Next.js 15.

```text
/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Authentication group (login, signup)
│   ├── (dashboard)/      # Protected user dashboard
│   ├── (admin)/          # Protected admin panel
│   ├── api/              # Route handlers (Stripe webhooks, etc.)
│   ├── products/         # Dynamic product routes [id]
│   ├── category/         # Dynamic category routes [slug]
│   └── layout.tsx        # Global layout & providers
├── components/           # Reusable UI components
│   ├── ui/               # Shadcn components
│   ├── marketplace/      # Product cards, banners, etc.
│   ├── admin/            # Admin tables, charts
│   └── shared/           # Header, Sidebar, Footer
├── lib/                  # Server-side utilities
│   ├── supabase/         # Supabase client (Server & Client versions)
│   ├── stripe/           # Stripe server client
│   └── utils.ts          # Tailwind merge, etc.
├── actions/              # Server Actions (Sensitive mutations)
│   ├── checkout.ts       # Secure payment initialization
│   ├── inventory.ts      # Admin stock management
│   └── auth.ts           # Login/Signup logic
├── middleware.ts         # Global Route Protection & Session management
├── services/             # Data fetching logic (Data Access Layer)
├── hooks/                # Client-side hooks
├── types/                # TypeScript definitions
└── public/               # Static assets (robots.txt, sitemap.xml)
```

## 🔐 2. Security-First Migration Strategy
### A. Logic Migration
- **Move to Server:** All pricing, stock validation, and order creation logic is moved to `actions/checkout.ts`. The frontend no longer calculates anything.
- **Middleware Protection:** Routes like `/admin/*` and `/dashboard/*` are protected at the infrastructure level in `middleware.ts`. Unauthorized requests are redirected before they even hit the page.

### B. Data Fetching
- **Server Components:** Use React Server Components (RSC) to fetch product data directly from Supabase. This eliminates `useEffect` loading spinners and improves SEO significantly.
- **Caching & ISR:** Product pages will use Incremental Static Regeneration (ISR) to be lightning-fast while staying updated.

## 🚀 3. Critical Implementation Samples

### Middleware (Auth Protection)
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Protect Admin Routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session || session.user.user_metadata.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return res
}
```

### Server Action (Secure Checkout)
```typescript
// actions/checkout.ts
"use server"

export async function createCheckoutSession(productId: string, quantity: number) {
  // 1. Authenticate User on Server
  // 2. Fetch Price & Stock from Supabase (Server-side)
  // 3. Atomically initialize order via SQL RPC
  // 4. Generate Stripe session
  // 5. Return redirect URL
}
```

## 📈 4. Performance & SEO
- **Images:** Migrating `<img>` to `next/image` for automatic WebP conversion and lazy loading.
- **Metadata:** Implementing `generateMetadata` for dynamic SEO on product pages.
- **Streaming:** Using `loading.tsx` and `Suspense` for instant page shell rendering.
