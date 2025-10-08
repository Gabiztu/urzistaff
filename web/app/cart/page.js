import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import ClientCart from "./ClientCart";

async function getInitialCart() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const token = cookies().get("cart_token")?.value;
  if (!token) return { id: null, items: [] };
  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("guest_token", token)
    .maybeSingle();
  if (!cart) return { id: null, items: [] };
  const { data: items } = await supabase
    .from("cart_items")
    .select("id, listing_id, name, headline, price, created_at")
    .eq("cart_id", cart.id)
    .order("created_at", { ascending: true });
  return { id: cart.id, items: items || [] };
}

export default async function Page() {
  const cart = await getInitialCart();
  return (
    <div className="container page">
      <header style={{ textAlign: "center", marginBottom: 48 }}>
        <h1>
          <span className="gradient-text">Review Your Cart</span>
        </h1>
        <p>
          <a href="/shop">← Or continue browsing</a>
        </p>
      </header>

      <div className="cart-layout">
        <main className="cart-items">
          <h2 id="itemsTitle">Your Items ({cart.items.length})</h2>
          <ClientCart initialCart={cart} />
        </main>

        <aside className="order-summary">
          <h2>Order Summary</h2>
          <div className="price-details">
            {/* Values will hydrate in ClientCart for live updates */}
            <div className="price-row">
              <div className="label">Subtotal</div>
              <div id="subtotalVal" className="value">
                ${((cart.items?.length || 0) * 99).toFixed(2)}
              </div>
            </div>
            <div className="price-row" id="discountRow" style={{ display: "none" }}>
              <div className="label">Discount</div>
              <div id="discountVal" className="value">-$0.00</div>
            </div>
            <div className="price-row">
              <div className="label">Taxes & Fees</div>
              <div id="feesVal" className="value">$0.00</div>
            </div>
            <div className="price-row total">
              <div className="label">Total</div>
              <div id="totalVal" className="value">
                ${((cart.items?.length || 0) * 99).toFixed(2)}
              </div>
            </div>
          </div>
          <a id="toCheckout" className="btn-primary" href={cart.items.length ? "/checkout" : undefined} aria-disabled={!cart.items.length} style={{ marginTop: 32 }}>
            Proceed to Checkout
          </a>
          <p className="info-text">This is a one-time fee to connect with the assistant.</p>
        </aside>
      </div>
    </div>
  );
}
