import type { Metadata } from "next";
import { ContentPage } from "@/src/components/ContentPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern purchases, payments, delivery, escrow and refunds at Account Store One.",
};

export default function TermsPage() {
  return (
    <ContentPage
      title="Terms of Service"
      updated="October 2026"
      intro="These terms govern your use of Account Store One and every purchase you make here. By creating an account or placing an order you agree to them."
      sections={[
        {
          heading: "1. The store and your account",
          body: [
            "Account Store One is a single-seller digital store: the store is the seller of every product listed. You must provide accurate account information and keep your password confidential. You are responsible for activity under your account. We may suspend accounts that abuse the store, other buyers, or the payment process.",
          ],
        },
        {
          heading: "2. Products and availability",
          body: [
            "Products are digital goods (accounts, subscriptions and items) delivered electronically. Listings show live stock: checkout rejects orders for products with insufficient stock, and stock is reserved when an order is placed and released if the order is canceled unpaid. Prices are shown in USD and include the service fee displayed at checkout before you confirm.",
          ],
        },
        {
          heading: "3. Orders and payment",
          body: [
            "An order is created in an unpaid state. Payment options are: (a) manual bKash/Nagad payment to the store number shown at checkout, completed by submitting the Transaction ID and sender number for our verification; (b) store wallet balance; (c) card via Stripe when enabled. An order is only treated as paid after verification (manual or wallet) or a confirmed card payment — an order with no verified payment is never marked as paid.",
            "Submitting a Transaction ID that is not yours, is fabricated, or does not match the order total may lead to rejection of the payment and suspension of the account.",
          ],
        },
        {
          heading: "4. Delivery",
          body: [
            "Delivery is made into the Credential Vault on your order page. When delivery stock is available, assignment is automatic on payment verification; otherwise delivery is manual within a reasonable time. Delivery is deemed made when the credentials are visible in your vault.",
          ],
        },
        {
          heading: "5. Escrow",
          body: [
            "Verified payments are held in escrow until the earliest of: your confirmation of receipt; 48 hours after delivery without a dispute; or a dispute resolution. Escrow is a buyer-protection mechanism, not a bank deposit, and wallet balances are store credit denominated in USD.",
          ],
        },
        {
          heading: "6. Disputes, replacement and refunds",
          body: [
            "If delivered credentials are invalid or materially different from the listing, open a dispute from the order page. We will, at our discretion based on the facts, deliver a replacement from stock or refund the order. Refunds are credited to your store wallet and shown in your wallet ledger; they are not paid out in cash except where the law requires otherwise. Fraudulent dispute claims may lead to account suspension.",
          ],
        },
        {
          heading: "7. Acceptable use",
          body: [
            "You agree not to use purchased accounts in ways that violate the terms of the underlying service, applicable law, or third-party rights; not to resell access credentials obtained through a dispute replacement; and not to attempt to access orders, wallets or data that are not yours.",
          ],
        },
        {
          heading: "8. Liability",
          body: [
            "To the maximum extent permitted by law, our liability for any order is limited to the amount you paid for that order. We are not liable for a platform's own actions (for example, an underlying service changing its features), but a product that never works as described is covered by Section 6.",
          ],
        },
        {
          heading: "9. Changes",
          body: [
            "We may update these terms; the version published on this page at the time of your order applies to that order. Continued use of the store after changes take effect constitutes acceptance for new orders.",
          ],
        },
      ]}
    />
  );
}
