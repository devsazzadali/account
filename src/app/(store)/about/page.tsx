import type { Metadata } from "next";
import { ContentPage } from "@/src/components/ContentPage";

export const metadata: Metadata = {
  title: "About Us",
  description: "Account Store One is a single-seller digital store for premium accounts and subscriptions, with escrow buyer protection on every order.",
};

export default function AboutPage() {
  return (
    <ContentPage
      title="About Account Store One"
      intro="Account Store One is a digital store run by a single seller — us. We sell premium accounts, subscriptions and digital items, and every order is protected by escrow until your delivery is confirmed."
      sections={[
        {
          heading: "What we sell",
          body: [
            "We list a curated catalogue of digital products: streaming and software subscriptions, gaming accounts and related digital items. Every product page shows the live price and the stock actually available — if it is out of stock, the buy button is disabled rather than letting you pay for something we cannot deliver.",
          ],
        },
        {
          heading: "One seller, many buyers",
          body: [
            "Unlike a marketplace, there are no third-party sellers here. The store itself is the seller: we source, verify and deliver every item, and we are the only counterparty in your purchase. Product and stock management lives in our own admin panel, which keeps quality and accountability in one place — ours.",
          ],
        },
        {
          heading: "How buying works",
          body: [
            "You place an order, pay (by bKash or Nagad with manual Transaction-ID verification, from your store wallet, or by card when card payments are enabled), and your payment is held in escrow. As soon as payment is verified, delivery happens automatically from stock when an item is available; otherwise we deliver manually. Your credentials appear in the secure Credential Vault on your order page — never in a random email or chat message.",
            "You then confirm receipt to release the escrow, or open a dispute if anything is wrong. If we do not hear from you, escrow releases automatically 48 hours after delivery.",
          ],
        },
        {
          heading: "Why buyers trust the process",
          body: [
            "Payments are never marked as verified before they are actually verified. Refunds go to your store wallet with a full ledger trail you can inspect at any time. Ratings and review counts on this site come from real orders and real reviews — we do not publish invented numbers.",
          ],
        },
        {
          heading: "Talk to us",
          body: [
            "Questions about an order, a product, or a payment? Use the live support chat on any page or the messages section of your account dashboard — a human from the store team answers there.",
          ],
        },
      ]}
    />
  );
}
