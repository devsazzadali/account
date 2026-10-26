import { redirect } from "next/navigation";

// Single-seller store: seller surfaces were folded into the admin console.
export default function SoldOrdersRoute() {
  redirect("/admin/orders");
}
