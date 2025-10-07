export default function SuccessPage(){
  return (
    <main style={{padding:24}}>
      <h1>Payment successful</h1>
      <p>Thank you! Your payment was received. You will receive a confirmation shortly.</p>
      <p style={{marginTop:12}}>
        <a href="/shop" style={{color:'#7f5af0', textDecoration:'none'}}>Continue shopping</a>
      </p>
    </main>
  );
}
