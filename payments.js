/* =========================================================
   KIJANI KILO | PAYMENTS (the ONE file that talks to money)
   ---------------------------------------------------------
   A web page can never move money on its own. Real payments need
   a SERVER that holds your secret keys (M-Pesa Daraja, Airtel
   Money, your card gateway, PayPal) and talks to those providers.
   This file is the bridge between the checkout page and that server.

   DEMO_MODE: true   -> everything is SIMULATED. No money moves.
                        Use it to test the design and for demos.
   DEMO_MODE: false  -> the functions below call YOUR server at API_BASE.

   YOUR SERVER NEEDS THESE ENDPOINTS (all JSON, all POST unless noted)
     /payments/mpesa/stk-push      { phone, amount, orderRef }       -> { checkoutRequestId }
     /payments/mpesa/status  (GET) ?checkoutRequestId=...            -> { status: 'pending'|'success'|'failed', reference?, message? }
     /payments/airtel/collect      { phone, amount, orderRef }       -> { transactionId }
     /payments/airtel/status (GET) ?transactionId=...                -> { status, reference?, message? }
     /payments/card/session        { orderRef, amount, currency, returnUrl, cancelUrl } -> { redirectUrl }
     /payments/paypal/create-order { orderRef, amount, currency:'USD' } -> { orderID }
     /payments/paypal/capture      { orderID, orderRef }              -> { reference }
   After a redirect payment the provider sends the customer back to
   checkout.html?status=success&ref=KK-12345&txn=... (or status=failed).
   ALWAYS confirm the payment on the server (webhook / callback) before
   you mark an order as paid. The page alone must never be trusted.

   CARDS: never post raw card numbers to your own server. Use your
   gateway's hosted page (CARD_MODE: 'redirect') or its hosted fields.
   ========================================================= */
const KK_PAY = (() => {
  'use strict';

  const CONFIG = {
    DEMO_MODE: true,
    API_BASE: '/api',                     // your server, e.g. 'https://api.yourdomain.co.ke/api'
    CARD_MODE: 'demo',                    // 'demo' = show a practice card form | 'redirect' = send to the gateway's secure page
    PAYPAL_CLIENT_ID: '',                 // from developer.paypal.com (needed when DEMO_MODE is false)
    KES_PER_USD: 129,                     // PayPal does not take KES, so we show and charge USD. Update this rate.
    BUSINESS: {
      name: 'Kijani Kilo', tagline: 'Fresh vegetables by the kilo',
      phone: '0794008285', email: 'hello@kijanikilo.co.ke',
      pickup: 'KCA University Town Campus, Monrovia Plaza, Monrovia Street, Nairobi'
    }
  };

  const here = (file) => new URL(file, location.href).href;
  CONFIG.RETURN_URL = here('checkout.html');

  const sleep = (ms, signal) => new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    if (signal) signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Cancelled', 'AbortError')); });
  });
  const fail = (message) => Object.assign(new Error(message), { payment: true });
  const code = (prefix, n) => prefix + Array.from({ length: n }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

  async function api(path, { method = 'POST', body, signal } = {}) {
    const res = await fetch(CONFIG.API_BASE + path, {
      method, signal, headers: { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw fail(data.message || 'The payment request could not be completed.');
    return data;
  }

  // ask the server every 3 seconds until the customer has paid (or not)
  async function poll(path, signal, maxMs) {
    const end = Date.now() + maxMs;
    while (Date.now() < end) {
      await sleep(3000, signal);
      const r = await api(path, { method: 'GET', signal });
      if (r.status === 'success') return { reference: r.reference, provider: null };
      if (r.status === 'failed') throw fail(r.message || 'The payment was not completed.');
    }
    throw fail('We did not receive a confirmation in time. If money left your account, message us and we will check.');
  }

  /* ---------------- M-Pesa (STK push) ---------------- */
  async function mpesa({ phone, amount, orderRef }, hooks, signal) {
    hooks.onStatus('sending');
    if (CONFIG.DEMO_MODE) {
      await sleep(1300, signal);
      hooks.onStatus('prompt');
      await sleep(6000, signal);
      if (/0$/.test(phone)) throw fail('The M-Pesa request was cancelled on the phone.');   // demo: numbers ending in 0 fail
      return { reference: code('S', 9), provider: 'M-Pesa' };
    }
    const s = await api('/payments/mpesa/stk-push', { body: { phone, amount, orderRef }, signal });
    hooks.onStatus('prompt');
    const r = await poll(`/payments/mpesa/status?checkoutRequestId=${encodeURIComponent(s.checkoutRequestId)}`, signal, 90000);
    return { ...r, provider: 'M-Pesa' };
  }

  /* ---------------- Airtel Money ---------------- */
  async function airtel({ phone, amount, orderRef }, hooks, signal) {
    hooks.onStatus('sending');
    if (CONFIG.DEMO_MODE) {
      await sleep(1300, signal);
      hooks.onStatus('prompt');
      await sleep(6000, signal);
      if (/0$/.test(phone)) throw fail('The Airtel Money request was cancelled on the phone.');
      return { reference: code('AM', 9), provider: 'Airtel Money' };
    }
    const s = await api('/payments/airtel/collect', { body: { phone, amount, orderRef }, signal });
    hooks.onStatus('prompt');
    const r = await poll(`/payments/airtel/status?transactionId=${encodeURIComponent(s.transactionId)}`, signal, 90000);
    return { ...r, provider: 'Airtel Money' };
  }

  /* ---------------- Card ---------------- */
  async function card({ number, amount, orderRef }, hooks, signal) {
    hooks.onStatus('sending');
    if (CONFIG.DEMO_MODE) {
      await sleep(1300, signal);
      hooks.onStatus('verifying');                                  // 3-D Secure step
      await sleep(2400, signal);
      if (String(number).replace(/\s/g, '').endsWith('0002')) throw fail('Your bank declined this card. Try another card or payment method.');
      return { reference: code('CH', 10), provider: 'Card' };
    }
    // Real mode: the customer enters card details on the gateway's secure page, never on ours
    const s = await api('/payments/card/session', {
      body: { orderRef, amount, currency: 'KES', returnUrl: CONFIG.RETURN_URL + '?status=success&ref=' + orderRef, cancelUrl: CONFIG.RETURN_URL + '?status=failed&ref=' + orderRef },
      signal
    });
    hooks.onStatus('redirecting');
    window.location.href = s.redirectUrl;
    return new Promise(() => { /* the page is leaving */ });
  }

  /* ---------------- PayPal ---------------- */
  const usd = (kes) => Math.max(0.01, Math.round((kes / CONFIG.KES_PER_USD) * 100) / 100);

  async function paypalDemo(hooks, signal) {
    hooks.onStatus('sending');
    await sleep(2400, signal);
    return { reference: code('PP', 12), provider: 'PayPal' };
  }
  function loadPayPalSdk() {
    return new Promise((resolve, reject) => {
      if (window.paypal) return resolve(window.paypal);
      const s = document.createElement('script');
      s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(CONFIG.PAYPAL_CLIENT_ID)}&currency=USD&intent=capture`;
      s.onload = () => resolve(window.paypal);
      s.onerror = () => reject(fail('PayPal could not be loaded. Check your connection and try again.'));
      document.head.appendChild(s);
    });
  }
  const paypalCreateOrder = (orderRef, amountKes) => api('/payments/paypal/create-order', { body: { orderRef, amount: usd(amountKes), currency: 'USD' } }).then((d) => d.orderID);
  const paypalCapture = (orderID, orderRef) => api('/payments/paypal/capture', { body: { orderID, orderRef } }).then((d) => ({ reference: d.reference, provider: 'PayPal' }));

  /* ---------------- Coming back from a redirect ---------------- */
  function readReturn() {
    const q = new URLSearchParams(location.search);
    const status = q.get('status');
    return status ? { status, ref: q.get('ref') || '', txn: q.get('txn') || '' } : null;
  }

  return { CONFIG, mpesa, airtel, card, paypalDemo, loadPayPalSdk, paypalCreateOrder, paypalCapture, usd, readReturn };
})();
