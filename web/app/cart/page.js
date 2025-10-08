import { redirect } from "next/navigation";

export default function Page() {
  // Server-side redirect so the static file is the single source of truth
  redirect("/cart.html");
}
