# Expected Test Results

Run `npm run reset-db && npm start`, then in another terminal run `bash scripts/demo-requests.sh`.

| Test | Endpoint | Expected HTTP | Expected result |
|---|---|---:|---|
| SQL injection payload | `/api/login-vulnerable` | 200 | Fictional admin login bypass |
| Same SQL injection payload | `/api/login-safe` | 401 | Rejected; payload treated as literal username |
| Legitimate student credentials | `/api/login-safe` | 200 | Student login succeeds after scrypt verification |

The vulnerable endpoint is intentionally unsafe and must remain local-only.
