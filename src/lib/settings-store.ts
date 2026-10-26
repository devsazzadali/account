// AccountStoreOne — store settings (admin-editable, persisted in Neon).
// Resolution order: `store_settings` table → environment → built-in default.
// SECRETS ARE NEVER STORED HERE — Stripe keys etc. live in env only.
// The store's manual-payment numbers come from settings/env, never from
// hardcoded values in code.

import { prisma } from "./db";

export const SETTING_KEYS = {
  storeName: "store_name",
  storeDescription: "store_description",
  supportEmail: "support_email",
  bkashNumber: "payment_number_bkash",
  nagadNumber: "payment_number_nagad",
  paymentInstructions: "payment_instructions",
  notifyNewOrder: "notify_new_order",
} as const;

const ENV_FALLBACKS: Record<string, string | undefined> = {
  store_name: process.env.STORE_NAME,
  support_email: process.env.STORE_SUPPORT_EMAIL,
  payment_number_bkash: process.env.STORE_BKASH_NUMBER || process.env.STORE_PAYMENT_NUMBER,
  payment_number_nagad: process.env.STORE_NAGAD_NUMBER || process.env.STORE_PAYMENT_NUMBER,
  payment_instructions: process.env.STORE_PAYMENT_INSTRUCTIONS,
};

const DEFAULTS: Record<string, string> = {
  store_name: "Account Store One",
  store_description:
    "Premium digital accounts and subscriptions, delivered by a single verified seller with escrow buyer protection.",
  support_email: "",
  payment_number_bkash: "",
  payment_number_nagad: "",
  payment_instructions:
    "Send the exact order total to the number shown, then submit your Transaction ID and the number you sent from. An admin verifies every payment by hand before delivery.",
  notify_new_order: "true",
};

export async function getAllSettings(): Promise<Record<string, string>> {
  const out: Record<string, string> = { ...DEFAULTS };
  for (const [k, v] of Object.entries(ENV_FALLBACKS)) if (v) out[k] = v;
  try {
    const rows = await prisma.storeSetting.findMany();
    for (const r of rows) out[r.key] = r.value;
  } catch {
    // DB unavailable — env/defaults still give a coherent storefront.
  }
  return out;
}

export async function getSetting(key: string): Promise<string> {
  const all = await getAllSettings();
  return all[key] ?? "";
}

export async function setSettings(values: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(values)) {
    await prisma.storeSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}

/** Public payment configuration for the checkout UI. Numbers are only
 *  disclosed to signed-in buyers (they are shown at checkout by design). */
export async function getPaymentConfig(forSignedInUser: boolean) {
  const s = await getAllSettings();
  const bkash = s[SETTING_KEYS.bkashNumber];
  const nagad = s[SETTING_KEYS.nagadNumber];
  const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;
  return {
    manual: {
      enabled: !!(bkash || nagad),
      bkashNumber: forSignedInUser ? bkash || null : null,
      nagadNumber: forSignedInUser ? nagad || null : null,
      instructions: s[SETTING_KEYS.paymentInstructions],
    },
    stripe: { enabled: stripeEnabled },
    wallet: { enabled: true },
  };
}
