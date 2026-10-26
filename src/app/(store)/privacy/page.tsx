import type { Metadata } from "next";
import { ContentPage } from "@/src/components/ContentPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What data Account Store One collects, why, and the choices you have.",
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy Policy"
      updated="October 2026"
      intro="This policy explains what personal data Account Store One processes when you browse, buy, top up your wallet, or contact support — and why."
      sections={[
        {
          heading: "Data we collect",
          body: [
            "Account data: your name/username, email address, and a securely hashed password (or your identity-provider profile if you sign in with Google or GitHub).",
            "Order data: the products you order, amounts, payment status, the Transaction ID and sender number you submit for manual payments, delivery status, and any dispute you open.",
            "Wallet data: your balance and the ledger of credits and debits (top-ups, purchases, refunds, adjustments).",
            "Support data: messages you send us through the support chat or your dashboard.",
            "Technical data: the session cookie needed to keep you signed in, and standard request logs.",
          ],
        },
        {
          heading: "Why we use it",
          body: [
            "To operate your account, process and verify payments, deliver products into your order vault, hold and release escrow, resolve disputes, credit refunds, prevent fraud (including Transaction-ID abuse), and answer your support messages. We do not sell personal data.",
          ],
        },
        {
          heading: "Who receives it",
          body: [
            "Our infrastructure providers process data on our behalf: the database and authentication provider that hosts accounts, and Stripe when you choose card payment (Stripe receives the payment details needed to process the card transaction; we never see or store your full card number). We disclose data only where required by law or to protect the store and its buyers from fraud.",
          ],
        },
        {
          heading: "Cookies",
          body: [
            "We use a strictly necessary session cookie to authenticate you. We do not use advertising trackers on the store pages.",
          ],
        },
        {
          heading: "Retention",
          body: [
            "Order, wallet and dispute records are kept as long as needed for accounting, fraud prevention and the exercise or defence of claims. Support messages are kept with your account history. You can ask us to delete your account; records that must be retained by law or for fraud prevention may be kept in anonymised or restricted form.",
          ],
        },
        {
          heading: "Your choices and rights",
          body: [
            "You can review and update your profile from your account settings, and change your password at any time. Subject to applicable law, you may request access to, correction of, or deletion of your personal data, and object to certain processing. Contact us through the support chat and we will respond within a reasonable time.",
          ],
        },
        {
          heading: "Security",
          body: [
            "Passwords are hashed by our authentication provider, sessions are carried over HTTPS cookies, order and wallet data are only accessible to your account and authorised store administrators, and delivered credentials are shown only on your own order page. No system is perfectly secure; protect your password and do not share your vault credentials.",
          ],
        },
      ]}
    />
  );
}
