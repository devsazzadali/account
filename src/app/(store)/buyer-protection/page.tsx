import type { Metadata } from "next";
import { ContentPage } from "@/src/components/ContentPage";

export const metadata: Metadata = {
  title: "Buyer Protection",
  description: "How escrow, delivery guarantees, disputes, replacements and wallet refunds protect every Account Store One order.",
};

export default function BuyerProtectionPage() {
  return (
    <ContentPage
      title="Buyer Protection"
      intro="Every paid order at Account Store One is covered by the same protection, built into the order system itself — not a promise we ask you to take on faith."
      sections={[
        {
          heading: "Your money is held, not taken",
          body: [
            "When your payment is verified, it moves into escrow. The store does not treat it as final while escrow is open: it is released only when you confirm receipt, when 48 hours have passed after delivery with no dispute, or when a dispute is resolved.",
          ],
        },
        {
          heading: "Delivery you can verify",
          body: [
            "Delivered credentials appear in the Credential Vault on your own order page, tied to that order. If the vault is empty, nothing was delivered — no screenshots or chat claims change that. Check the credentials as soon as they arrive so the protection window works for you.",
          ],
        },
        {
          heading: "If something is wrong: open a dispute",
          body: [
            "From the order page, open a dispute and describe the problem (for example, the credentials do not work). Opening a dispute freezes the escrow — your money stays held while we review. Disputes opened after the 48-hour window are still reviewed on their facts when a product is genuinely defective.",
          ],
        },
        {
          heading: "Replacement or refund",
          body: [
            "A valid dispute ends in one of two ways: we deliver a replacement item from fresh stock (the faulty one is retired and never resold), or we refund the order to your store wallet. The refund appears in your wallet ledger with its reason, ready to spend on any later order.",
          ],
        },
        {
          heading: "What is not covered",
          body: [
            "Protection covers items that are invalid, inaccessible, or materially different from the listing. It does not cover buyer's remorse, problems caused by changing the account's credentials or security settings after delivery, or restrictions an underlying platform applies for reasons unrelated to the delivered account (for example, your own usage of it).",
          ],
        },
        {
          heading: "Honest numbers",
          body: [
            "The ratings, review counts and completed-order figures shown around the store are calculated from real orders and reviews in our database. If a figure does not exist yet, we show a dash rather than an invented number.",
          ],
        },
      ]}
    />
  );
}
