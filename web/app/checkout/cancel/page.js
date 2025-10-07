export default function CancelPage(){
  return (
    <main style={{padding:24}}>
      <h1>Payment canceled</h1>
      <p>Your payment was canceled. You can try again or return to your cart.</p>
      <p style={{marginTop:12}}>
        <a href="/cart" style={{color:'#7f5af0', textDecoration:'none'}}>Back to cart</a>
      </p>
    </main>
  );
}
