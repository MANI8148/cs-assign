const payload = "admin' -- ";
let mode = 'vulnerable';
const form = document.querySelector('#login-form');
const result = document.querySelector('#login-result');

function setMode(nextMode) {
  mode = nextMode;
  const safe = mode === 'safe';
  document.querySelector('#vulnerable-mode').classList.toggle('active-danger', !safe);
  document.querySelector('#safe-mode').classList.toggle('active-safe', safe);
  document.querySelector('#vulnerable-mode').setAttribute('aria-pressed', String(!safe));
  document.querySelector('#safe-mode').setAttribute('aria-pressed', String(safe));
  document.querySelector('#mode-number').className = safe ? 'number number-safe' : 'number';
  document.querySelector('#mode-eyebrow').textContent = safe ? 'AFTER FIX' : 'BEFORE FIX';
  document.querySelector('#mode-title').textContent = safe ? 'Safe login' : 'Vulnerable login';
  document.querySelector('#mode-detail').textContent = safe
    ? 'The backend uses a parameterized username lookup and verifies the password against its salted scrypt hash.'
    : 'The backend directly concatenates the submitted username and password into the SQL query.';
  document.querySelector('#submit-button').textContent = safe ? 'Run safe login' : 'Run vulnerable login';
  document.querySelector('#submit-button').className = safe ? 'button button-safe' : 'button button-danger';
  document.querySelector('#mode-description').className = safe ? 'mode-description safe-copy' : 'mode-description danger-copy';
  document.querySelector('#mode-description').textContent = safe
    ? '✓ Safe: parameterized SQL + salted scrypt password hashing and verification.'
    : '⚠️ Vulnerable: username and password are concatenated into SQL. Use fictional test data only.';
  result.textContent = 'Mode changed. Submit the form to test this implementation.';
  result.classList.remove('success', 'failure');
}

function showResult(data, status) {
  result.textContent = JSON.stringify(data, null, 2);
  result.classList.remove('success', 'failure');
  result.classList.add(status);
}

document.querySelector('#vulnerable-mode').addEventListener('click', () => setMode('vulnerable'));
document.querySelector('#safe-mode').addEventListener('click', () => setMode('safe'));
document.querySelector('#fill-payload').addEventListener('click', () => {
  document.querySelector('#username').value = payload;
  document.querySelector('#password').value = 'anything';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const credentials = {
    username: document.querySelector('#username').value,
    password: document.querySelector('#password').value
  };
  result.textContent = 'Sending request…';
  result.classList.remove('success', 'failure');
  const endpoint = mode === 'safe' ? '/api/login-safe' : '/api/login-vulnerable';
  try {
    const response = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials)
    });
    const data = await response.json();
    data.httpStatus = response.status;
    showResult(data, response.ok ? 'success' : 'failure');
  } catch (error) {
    showResult({ error: 'Could not reach the local server.', detail: error.message }, 'failure');
  }
});
