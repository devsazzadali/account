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
  },
};

export function deliveryInfo(raw?: string | null): DeliveryInfo {
  return INFO[normalizeFulfilment(raw)];
}
