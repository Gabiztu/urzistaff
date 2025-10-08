"use client";
import { useEffect, useRef, useState } from "react";

export default function ClientCheckout() {
  const formRef = useRef(null);
  const [valid, setValid] = useState(true);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const update = () => setValid(form.checkValidity());
    const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
    inputs.forEach((el) => {
      el.addEventListener('input', update);
      el.addEventListener('change', update);
      el.addEventListener('blur', update);
    });
    update();
    return () => inputs.forEach((el) => {
      el.removeEventListener('input', update);
      el.removeEventListener('change', update);
      el.removeEventListener('blur', update);
    });
  }, []);

  const onConfirmPay = async (e) => {
    e.preventDefault();
    const form = formRef.current;
    if (form && !form.checkValidity()) { form.reportValidity(); return; }
    try {
      const payload = {};
      if (form) {
        payload.fullName = form.querySelector('#fullName')?.value || undefined;
        payload.telegram = form.querySelector('#telegram')?.value || undefined;
        const noteOn = form.querySelector('#addNoteToggle')?.checked;
        payload.note = noteOn ? (form.querySelector('#orderNote')?.value || '').trim() : undefined;
      }
      const res = await fetch('/api/checkout/nowpayments/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json().catch(()=>({}));
      const invoiceUrl = json?.invoice_url || json?.url;
      if (!res.ok || !invoiceUrl) throw new Error(json?.error || 'Failed to create invoice');
      window.location.href = invoiceUrl;
    } catch (err) {
      alert((err && err.message) || 'Failed to start payment. Please try again.');
    }
  };

  return (
    <form id="checkoutForm" ref={formRef} action="#" method="POST">
      <div className="form-section">
        <h2>Contact information</h2>
        <p className="helper-text">We'll use this Telegram username to send you order details and updates.</p>
        <div className="form-group" style={{marginTop:10}}>
          <label htmlFor="telegram">Telegram Username</label>
          <input type="text" id="telegram" name="telegram" className="input" placeholder="@username" required pattern="^@[A-Za-z][A-Za-z0-9_]{4,31}$" title="Must start with @, begin with a letter, and be 5–32 characters using letters, numbers, or underscore" />
          <p className="helper-text">You are currently checking out as a guest.</p>
        </div>
      </div>
      <div className="form-section">
        <h2>Billing Information</h2>
        <div className="form-row" style={{marginBottom:12}}>
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input type="text" id="fullName" name="fullName" className="input" placeholder="John M. Doe" required pattern="^[A-Za-z' -]+$" title="Only letters, spaces, hyphens (-), and apostrophes (') are allowed" inputMode="text" autoComplete="name" />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="address">Street Address</label>
          <input type="text" id="address" name="address" className="input" placeholder="123 Main Street" required />
        </div>
        <div className="form-row" style={{marginBottom:12}}>
          <div className="form-group" style={{flex:1}}>
            <label htmlFor="country">Country</label>
            <select id="country" name="country" className="input" required defaultValue="">
              <option value="" disabled>Select your country</option>
              <option>United States</option>
              <option>United Kingdom</option>
              <option>Canada</option>
              <option>Australia</option>
              <option>New Zealand</option>
              <option>Ireland</option>
              <option>Germany</option>
              <option>France</option>
              <option>Italy</option>
              <option>Spain</option>
              <option>Portugal</option>
              <option>Netherlands</option>
              <option>Belgium</option>
              <option>Switzerland</option>
              <option>Austria</option>
              <option>Sweden</option>
              <option>Norway</option>
              <option>Denmark</option>
              <option>Finland</option>
              <option>Poland</option>
              <option>Czechia</option>
              <option>Romania</option>
              <option>Greece</option>
              <option>Hungary</option>
              <option>Bulgaria</option>
              <option>Croatia</option>
              <option>Serbia</option>
              <option>Turkey</option>
              <option>Ukraine</option>
              <option>Russia</option>
              <option>Brazil</option>
              <option>Mexico</option>
              <option>Argentina</option>
              <option>Chile</option>
              <option>Colombia</option>
              <option>Peru</option>
              <option>Philippines</option>
              <option>India</option>
              <option>Indonesia</option>
              <option>Malaysia</option>
              <option>Singapore</option>
              <option>Thailand</option>
              <option>Vietnam</option>
              <option>Japan</option>
              <option>South Korea</option>
              <option>China</option>
              <option>South Africa</option>
              <option>Nigeria</option>
              <option>Kenya</option>
              <option>Egypt</option>
              <option>United Arab Emirates</option>
            </select>
          </div>
          <div className="form-group" style={{flex:1}}>
            <label htmlFor="region">State/County/Province</label>
            <input type="text" id="region" name="region" className="input" placeholder="State / County / Province" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input type="text" id="city" name="city" className="input" placeholder="New York" required pattern="^[A-Za-z ]+$" title="Only letters and spaces are allowed" inputMode="text" autoComplete="address-level2" />
          </div>
          <div className="form-group">
            <label htmlFor="zip">ZIP Code</label>
            <input type="text" id="zip" name="zip" className="input" placeholder="10001" required />
          </div>
        </div>
      </div>
      <div className="form-section">
        <h2>Payment options</h2>
        <label className="pay-option" htmlFor="pay-now">
          <input type="radio" id="pay-now" name="payment" value="nowpayments" defaultChecked hidden />
          <div className="pay-card">
            <div className="pay-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8Z" fill="currentColor"/>
                <path d="M12 6a1 1 0 0 0-1 1v3H9a1 1 0 0 0 0 2h2v3a1 1 0 0 0 2 0v-3h2a1 1 0 0 0 0-2h-2V7a1 1 0 0 0-1-1Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="pay-meta">
              <div className="pay-title">NOWPayments</div>
              <div className="pay-desc">Pay with NOWPayments</div>
            </div>
            <div className="pay-check" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </label>
        <div className="form-group" style={{marginTop:14}}>
          <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',userSelect:'none'}}>
            <input type="checkbox" id="addNoteToggle" style={{width:16,height:16}} /> Add a note to your order
          </label>
          <textarea id="orderNote" className="input" placeholder="Notes about your order." style={{display:'none',minHeight:90,resize:'vertical'}} />
        </div>
        <p className="legal-text">By proceeding with your purchase you agree to our <a href="/terms" target="_blank" rel="noopener">Terms and Conditions</a> and <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</p>
      </div>
      {/* Hidden submit since button is outside form */}
      <button type="submit" style={{display:'none'}} />
      <script dangerouslySetInnerHTML={{__html: `
        (function(){
          var toggle = document.getElementById('addNoteToggle'); var area = document.getElementById('orderNote');
          if (toggle && area) { var sync = function(){ area.style.display = toggle.checked ? '' : 'none'; }; toggle.addEventListener('change', sync); sync(); }
        })();
      `}} />
      <div style={{display:'none'}} aria-hidden="true" />
      <div>
        <button className="btn-primary" onClick={onConfirmPay} type="button" disabled={!valid} style={{display:'none'}} />
      </div>
    </form>
  );
}
