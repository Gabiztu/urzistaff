import { redirect } from "next/navigation";

export default function Page() {
  // Server-side redirect to the static checkout page
  redirect("/checkout.html");
}
