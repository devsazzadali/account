// AccountStoreOne — ONE source of truth for delivery claims (F-27).
//
// Every surface that tells a buyer how a product is delivered — listing
// cards, the product page hero, the delivery tab, the delivery timeline,
// the trust badges and the order page — derives its wording from the
// product's real `fulfilmentType` through this helper. A manual product
// must never be labelled "Instant" / "Auto" anywhere, and vice versa.

export type FulfilmentType = "instant" | "manual" | "service";

export function normalizeFulfilment(raw?: string | null): FulfilmentType {
  return raw === "instant" || raw === "service" ? raw : "manual";
}

export interface DeliveryInfo {
  type: FulfilmentType;
  /** True only for instant (automatic) delivery. */
  auto: boolean;
  /** Short badge word: "Instant" | "Manual" | "Service". */
  short: string;
  /** Badge label: "Instant Delivery" | "Manual Delivery" | "Service". */
  label: string;
  /** Product-page sentence under the price. */
  line: string;
  /** Delivery-tab heading + body on the product page. */
  tabTitle: string;
  tabCopy: string;
  /** Product-page delivery timeline steps. */
  steps: { label: string; sub: string }[];
  /** Checkout step-1 "What You Get" bullets. */
  checkoutPoints: string[];
  /** Checkout confirmation note shown after a wallet payment. */
  paidNote: string;
}

const ESCROW_TAIL =
  "Your payment stays held in escrow until you confirm receipt — open a dispute from the order page if anything is wrong.";

const INFO: Record<FulfilmentType, DeliveryInfo> = {
  instant: {
    type: "instant",
    auto: true,
    short: "Instant",
    label: "Instant Delivery",
    line: "Instant delivery — credentials arrive automatically right after payment is verified",
    tabTitle: "Automatic Delivery",
    tabCopy:
      "As soon as your payment is verified, the credentials appear automatically in the Credential Vault on your order page. " +
      ESCROW_TAIL,
    steps: [
      { label: "Payment Verified", sub: "Automatic" },
      { label: "Auto Assignment", sub: "From stock" },
      { label: "Credentials Ready", sub: "In your vault" },
    ],
    checkoutPoints: [
      "Full account credentials (email + password) in your order vault",
      "Instant delivery — credentials are delivered automatically right after payment is verified",
      "48-hour escrow buyer protection after delivery",
      "Replacement or wallet refund if the credentials don't work",
    ],
    paidNote: "your credentials are in the vault on your order page.",
  },
  manual: {
    type: "manual",
    auto: false,
    short: "Manual",
    label: "Manual Delivery",
    line: "Manual delivery — the store sends your credentials after payment is verified",
    tabTitle: "Manual Delivery",
    tabCopy:
      "This item is delivered by the store, not automatically. After your payment is verified, the store prepares your credentials and places them in the Credential Vault on your order page — you'll get a notification when they're ready. " +
      ESCROW_TAIL,
    steps: [
      { label: "Payment Verified", sub: "By the store" },
      { label: "Store Prepares", sub: "Manual delivery" },
      { label: "Credentials Ready", sub: "In your vault" },
    ],
    checkoutPoints: [
      "Full account credentials (email + password) in your order vault",
      "Manual delivery — the store sends your credentials after payment is verified",
      "48-hour escrow buyer protection after delivery",
      "Replacement or wallet refund if the credentials don't work",
    ],
    paidNote: "the store will send your credentials to the vault on your order page — you'll get a notification when they're ready.",
  },
  service: {
    type: "service",
    auto: false,
    short: "Service",
    label: "Service",
    line: "Service — details required at checkout; the store performs the work and posts progress + proof on your order",
    tabTitle: "How This Service Works",
    tabCopy:
      "You provide the details at checkout, and once your payment is verified the store performs the work for you. Progress updates and completion proof are posted on your order page. " +
      ESCROW_TAIL,
    steps: [
      { label: "Payment Verified", sub: "By the store" },
      { label: "Work in Progress", sub: "Progress posted" },
      { label: "Delivered", sub: "Proof on order page" },
    ],
    checkoutPoints: [
      "The service performed using the details you provided at checkout",
      "Progress updates and completion proof posted on your order page",
      "48-hour escrow buyer protection after completion",
      "Redo or wallet refund if the service isn't delivered as described",
    ],
    paidNote: "the store will start the work and post progress on your order page.",
  },
};

export function deliveryInfo(raw?: string | null): DeliveryInfo {
  return INFO[normalizeFulfilment(raw)];
}

/**
 * The buyer-visible ETA promise for a product's `delivery_eta_hours`
 * (video-gap #1): "Delivery within ~24 hours of payment verification".
 * Single source for the PDP, checkout and the buyer order page so the
 * promise reads identically everywhere — and it is the same window the
 * admin "ETA passed" flag measures from order creation. Returns null
 * when the product carries no ETA: callers render nothing rather than
 * invent a promise the store never made.
 */
export function etaLine(etaHours?: number | null): string | null {
  if (etaHours == null || !Number.isFinite(etaHours) || etaHours <= 0) return null;
  return `Delivery within ~${etaHours} hours of payment verification`;
}
