import { redirect } from "next/navigation";

// Single-seller store: product creation lives in the admin console.
export default function CreateListingRoute() {
  redirect("/admin/products");
}
