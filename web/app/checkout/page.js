import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import ClientCheckout from "./ClientCheckout";

async function getInitialCart() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const token = cookies().get("cart_token")?.value;
  if (!token) return [];
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("guest_token", token)
    .maybeSingle();
  if (!cart) return [];
  const { data: items } = await supabase
    .from("cart_items")
    .select("id, listing_id, name, headline, price, created_at")
    .eq("cart_id", cart.id)
    .order("created_at", { ascending: true });
  return items || [];
}

export default async function Page() {
  const initialItems = await getInitialCart();
  const subtotal = (initialItems?.length || 0) * 99;
  return (
    <div className="container">
      <header style={{ textAlign: "left", marginBottom: 24 }}>
        <h1>
          <span className="gradient-text">Secure Checkout</span>
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 15, margin: 0 }}>
          You're one step away from boosting your productivity.
        </p>
      </header>
      <div className="checkout-layout">
        <main className="payment-form">
          <ClientCheckout />
        </main>
        <aside className="order-summary">
          <h2>Order Summary</h2>
          <h3 className="items-title">
            Items (<span>{initialItems.length}</span>)
          </h3>
          <div className="items-list">
            {initialItems.map((it) => (
              <div key={it.listing_id || it.id} className="item-row">
                <div className="name">{it.name || "Listing"}</div>
                <div className="price">${"$" + (it.price || 99).toFixed?.(2) ?? (99).toFixed(2)}</div>
              </div>
            ))}
            {initialItems.length === 0 && (
              <div className="item-row" style={{ justifyContent: "center", color: "var(--muted)" }}>
                Your cart is empty.
              </div>
            )}
          </div>
          <div className="price-details">
            <div className="price-row">
              <div className="label">Order Date</div>
              <div className="value">{new Date().toLocaleString()}</div>
            </div>
            <div className="price-row">
              <div className="label">Subtotal</div>
              <div className="value">${"$" + subtotal.toFixed(2)}</div>
            </div>
            <div className="price-row">
              <div className="label">Taxes & Fees</div>
              <div className="value">$0.00</div>
            </div>
            <div className="price-row total">
              <div className="label">Total</div>
              <div className="value">${"$" + subtotal.toFixed(2)}</div>
            </div>
          </div>
          <a href="/cart" className="btn-secondary">
            Return to cart
          </a>
          <button className="btn-primary" type="submit" form="checkoutForm" style={{ marginTop: 8 }}>
            Confirm and Pay
          </button>
          <div className="secure-info">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9A9 9 0 0 0 12 1zm0 16a7 7 0 0 1-7-7 7 7 0 0 1 7-7 7 7 0 0 1 7 7 7 7 0 0 1-7 7z" />
              <path d="M12 7a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0V8a1 1 0 0 0-1-1zm0 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
            </svg>
            <span>Payments are secure and encrypted.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
