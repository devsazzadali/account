import type { Metadata } from "next";
import { ContentPage } from "@/src/components/ContentPage";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "How buying, payment verification, escrow, delivery, wallet top-ups and disputes work at Account Store One.",
};

export default function FaqPage() {
  return (
    <ContentPage
      title="Frequently Asked Questions"
      intro="Straight answers about how this store works — payments, verification, delivery, escrow and refunds."
      sections={[
        {
          heading: "How do I buy something?",
          body: [
            "Create an account, open the product, and click Buy Now. At checkout you will see the exact total (product price plus a small service fee) before you commit. Placing the order reserves the stock for you; the order sits at Awaiting Payment until you pay.",
          ],
        },
        {
          heading: "Which payment methods can I use?",
          body: [
            "bKash and Nagad: send the total to the store number shown at checkout, then submit the Transaction ID and the number you sent from. Our team verifies the Transaction ID manually — your order shows Payment Under Verification until it is approved.",
            "Store wallet: if your wallet balance covers the total, you can pay instantly from the wallet at checkout or from the order page.",
            "Card (Stripe): offered at checkout only when card payments are enabled for the store; you will be redirected to Stripe's secure checkout.",
          ],
        },
        {
          heading: "How long does verification take?",
          body: [
            "Manual Transaction-ID verification is done by a human and is usually completed within a few hours. Wallet payments settle instantly. Your order page updates automatically as soon as the state changes — you do not need to refresh or chase us.",
          ],
        },
        {
          heading: "When do I get my credentials?",
          body: [
            "The moment your payment is verified. If the product has delivery stock, the assignment is automatic and the credentials appear in the Credential Vault on your order page. If stock runs out, we deliver manually and the vault fills in the same way. We never send credentials to a different email or over social media.",
          ],
        },
        {
          heading: "What is escrow and the 48-hour window?",
          body: [
            "Your verified payment is held in escrow — it is not released to the store until you confirm receipt, or until 48 hours pass after delivery. If the delivered credentials do not work, open a dispute from the order page inside that window (and afterwards if the problem appears later — we review every dispute on its facts).",
          ],
        },
        {
          heading: "How do disputes and refunds work?",
          body: [
            "Open a dispute from the order page and describe the problem. We can replace the item with a fresh one from stock, or refund you. Refunds are credited to your store wallet — you will see the credit, with its reason, in your wallet ledger — and you can spend it on any later order.",
          ],
        },
        {
          heading: "How do wallet top-ups work?",
          body: [
            "From your dashboard's Wallet tab: choose bKash or Nagad, send the amount to the store number, and submit the Transaction ID. The balance is credited after the same manual verification used for orders. Pending top-ups are listed in the wallet until they are approved or rejected.",
          ],
        },
        {
          heading: "Can I cancel an order?",
          body: [
            "Yes. An unpaid order can be canceled from the order page or your order history, and its reserved stock is released. A paid order that has not been delivered yet can also be canceled — the payment is refunded to your store wallet.",
          ],
        },
        {
          heading: "I forgot my password. What now?",
          body: [
            "Use the Forgot? link on the sign-in page — we will email you a reset link. If you signed up with Google or GitHub, continue with that provider instead.",
          ],
        },
      ]}
    />
  );
}
