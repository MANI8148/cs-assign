# SQL Injection Lab — Variant 1

A local classroom demonstration with a **single frontend login form** and two mode switches:
- **Vulnerable mode:** intentionally concatenates untrusted input into SQL so the SQL injection can be reproduced.
- **Safe mode:** uses a parameterized username query and salted **scrypt** password hashing/verification.

> Safety: fictional accounts only. The server binds to `127.0.0.1`. Never deploy this lab or expose it to a network. The vulnerable database password column exists only to make the exploit reproducible for the assignment.

## Requirements
- Node.js 22.5+ (uses the built-in `node:sqlite` module)
- No third-party npm packages required

## Run
```bash
npm run reset-db
npm start
```
Open http://127.0.0.1:3000.

## Frontend demonstration
1. Select **Vulnerable mode**.
2. Click **Fill payload**. Username becomes `admin' -- ` and password becomes `anything`.
3. Submit. Expected: HTTP 200 and the fictional admin account is returned.
4. Select **Safe mode**. The same values remain in the form.
5. Submit again. Expected: HTTP 401 because the payload is treated as a literal username, not SQL syntax.
6. For a legitimate safe-mode test, use `student` / `StudentLab!`. Expected: HTTP 200.

You can also run `bash scripts/demo-requests.sh` while the server is running.

## Where the code is
- `server.js` — vulnerable endpoint and safe endpoint.
- `public/index.html`, `public/app.js`, `public/styles.css` — frontend and mode switch.
- `database/schema.sql`, `database/seed.sql`, `database/lab.db` — SQLite schema, fictional seed records and generated DB.
- `scripts/init-db.js` — rebuilds the DB and generates a unique salt + scrypt hash for each demo account.
- `docs/VIVA_NOTES.md` — explanation and viva points.

## Vulnerable vs safe code

Vulnerable (intentionally unsafe):
```js
const sql = `SELECT id, username, role FROM users WHERE username = '${username}' AND password = '${password}' LIMIT 1`;
const user = db.prepare(sql).get();
```

Safe: parameterized lookup followed by password-hash verification:
```js
const record = db.prepare(
  'SELECT id, username, role, password_salt, password_hash FROM users WHERE username = ? LIMIT 1'
).get(username);
const valid = record && verifyPassword(password, record.password_salt, record.password_hash);
```

Safe mode uses Node's built-in `scryptSync` with a random per-user salt and `timingSafeEqual`. Hashing protects stored credentials; parameterized SQL prevents SQL injection. They address different risks and are used together.

## Table 2 coverage
(a) Vulnerable code path: `POST /api/login-vulnerable` in `server.js`.
(b) Working exploit: username `admin' -- ` with any password; run only against this local lab.
(c) Root cause: attacker-controlled strings are concatenated into the SQL statement.
(d) Implemented mitigation: `POST /api/login-safe` uses a parameterized query and salted scrypt hash verification; the same payload returns HTTP 401.
(e) Other mitigations: allow-list validation limits accepted input formats; least-privilege DB accounts limit impact if a flaw remains; safe error handling avoids disclosing SQL text or schema details. These are defence-in-depth, not replacements for parameterized queries.

## Ownership declaration (complete before submission)
| Member name | Roll number | Category | Variant implemented |
|---|---|---|---|
| YOUR NAME | YOUR ROLL NUMBER | SQL Injection | Variant 1 |
