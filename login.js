/* =========================================================
   KIJANI KILO | LOGIN PAGE BEHAVIOUR
   ========================================================= */
(() => {
  'use strict';

  const viewSignin   = document.getElementById('view-signin');
  const viewRegister = document.getElementById('view-register');
  const switchSignin   = document.getElementById('switch-signin');
  const switchRegister = document.getElementById('switch-register');

  /* ---------------------------------------------------------
     1. Switch between "Login" and "Create account"
     --------------------------------------------------------- */
  const showView = (name) => {
    const reg = name === 'register';
    viewSignin.hidden     = reg;
    viewRegister.hidden   = !reg;
    switchSignin.hidden   = reg;
    switchRegister.hidden = !reg;
    document.title = reg ? 'Create account | Kijani Kilo' : 'Sign in | Kijani Kilo';
    const firstField = (reg ? viewRegister : viewSignin).querySelector('input');
    if (firstField) firstField.focus({ preventScroll: true });
  };

  document.querySelectorAll('[data-go]').forEach((el) => {
    el.addEventListener('click', () => showView(el.dataset.go));
  });

  // Open the right form from a link:  login.html?tab=register
  const params = new URLSearchParams(window.location.search);
  if (params.get('tab') === 'register' || window.location.hash === '#register') {
    viewSignin.hidden = true;
    viewRegister.hidden = false;
    switchSignin.hidden = true;
    switchRegister.hidden = false;
    document.title = 'Create account | Kijani Kilo';
  }


  /* ---------------------------------------------------------
     2. Show / hide password
     --------------------------------------------------------- */
  document.querySelectorAll('.pw-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });


  /* ---------------------------------------------------------
     3. Validation rules (plain words, shown under each field)
     --------------------------------------------------------- */
  const cleanPhone = (v) => v.replace(/[\s-]/g, '');
  const isPhone = (v) => /^(?:\+254|254|0)(?:7|1)\d{8}$/.test(cleanPhone(v));
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

  const rules = {
    'si-id': (v) => {
      if (!v.trim()) return 'Enter your email or phone number.';
      return isEmail(v) || isPhone(v)
        ? ''
        : 'Use a valid email, or a phone number starting with 07 or 01.';
    },
    'si-pw':    (v) => (v ? '' : 'Enter your password.'),
    'rg-name':  (v) => (v.trim().length >= 3 ? '' : 'Enter your full name.'),
    'rg-phone': (v) => (isPhone(v) ? '' : 'Phone number should start with 07 or 01 and have 10 digits.'),
    'rg-email': (v) => (isEmail(v) ? '' : 'Enter a valid email address.'),
    'rg-pw':    (v) => (v.length >= 8 ? '' : 'Use at least 8 characters.'),
    'rg-terms': (_v, el) => (el.checked ? '' : 'Please accept the terms to continue.')
  };

  const checkField = (input) => {
    const rule = rules[input.id];
    if (!rule) return true;
    const message = rule(input.value, input);
    const out = document.getElementById(input.id + '-err');
    if (out) out.textContent = message;
    input.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
  };

  document.querySelectorAll('.auth-form input').forEach((input) => {
    if (!rules[input.id]) return;
    input.addEventListener('blur', () => { if (input.value || input.type === 'checkbox') checkField(input); });
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') checkField(input); });
  });


  /* ---------------------------------------------------------
     4. Submit
     Replace the setTimeout block with a real request to your
     backend. Example:

       const res = await fetch('/api/auth/login', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ identifier, password })
       });
     --------------------------------------------------------- */
   /* ---------------------------------------------------------
     4. Submit (Connected to Laravel Backend)
     --------------------------------------------------------- */
  const handleBackendSubmit = (form, isRegister) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const inputs = [...form.querySelectorAll('input')].filter((i) => rules[i.id]);
      const results = inputs.map(checkField);
      const firstBad = inputs.find((_, i) => !results[i]);
      const status = form.querySelector('.form-status');
      status.textContent = '';

      if (firstBad) { firstBad.focus(); return; }

      const btn = form.querySelector('button[type="submit"]');
      btn.classList.add('is-loading');

      try {
        let endpoint, payload;

        if (isRegister) {
          endpoint = '/api/auth/register';
          payload = {
            name: document.getElementById('rg-name').value,
            phone: document.getElementById('rg-phone').value,
            email: document.getElementById('rg-email').value,
            password: document.getElementById('rg-pw').value
          };
        } else {
          endpoint = '/api/auth/login';
          payload = {
            identifier: document.getElementById('si-id').value,
            password: document.getElementById('si-pw').value
          };
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        btn.classList.remove('is-loading');

        if (response.ok) {
          // Store token and user details locally
          localStorage.setItem('kk_token', data.access_token);
          localStorage.setItem('kk_user', JSON.stringify(data.user));

          status.style.color = 'green';
          status.textContent = isRegister ? 'Account created successfully! Redirecting...' : 'Signed in successfully! Redirecting...';

          setTimeout(() => {
            window.location.href = 'kijanikilo.html';
          }, 800);
        } else {
          status.style.color = 'red';
          status.textContent = data.message || (data.errors ? Object.values(data.errors)[0][0] : 'Authentication failed.');
        }

      } catch (error) {
        console.error('Network error:', error);
        btn.classList.remove('is-loading');
        status.style.color = 'red';
        status.textContent = 'Unable to connect to the backend server.';
      }
    });
  };

  handleBackendSubmit(document.getElementById('signinForm'), false);
  handleBackendSubmit(document.getElementById('registerForm'), true);
})