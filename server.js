import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = resolve(ROOT, 'public');
const DB_PATH = resolve(ROOT, 'database', 'lab.db');
const HOST = '127.0.0.1'; // Intentionally local-only for the classroom exercise.
const PORT = Number(process.env.PORT || 3000);
const MAX_BODY_BYTES = 16 * 1024;
const db = new DatabaseSync(DB_PATH);

// SAFE MODE: the SQL structure is fixed; the username is passed as a parameter.
const findUserByUsername = db.prepare(
  'SELECT id, username, role, password_salt, password_hash FROM users WHERE username = ? LIMIT 1'
);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer'
  });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
      const error = new Error('Request body is too large'); error.statusCode = 413; throw error;
    }
  }
  try { return JSON.parse(body || '{}'); }
  catch { const error = new Error('Request body must be valid JSON'); error.statusCode = 400; throw error; }
}

function validateCredentials(payload) {
  const { username, password } = payload || {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    const error = new Error('username and password must be strings'); error.statusCode = 400; throw error;
  }
  if (username.length > 256 || password.length > 256) {
    const error = new Error('Credential fields must be 256 characters or fewer'); error.statusCode = 400; throw error;
  }
  return { username, password };
}

function verifyPassword(password, saltHex, expectedHashHex) {
  const actual = scryptSync(password, saltHex, 64);
  const expected = Buffer.from(expectedHashHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function serveStatic(pathname, res) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = resolve(PUBLIC_DIR, `.${requestedPath}`);
  if (!filePath.startsWith(PUBLIC_DIR + sep) && filePath !== PUBLIC_DIR) return sendJson(res, 404, { error: 'Not found' });
  try {
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(content);
  } catch { sendJson(res, 404, { error: 'Not found' }); }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
  if (req.method === 'GET') return serveStatic(url.pathname, res);

  if (req.method === 'POST' && ['/api/login-vulnerable', '/api/login-safe'].includes(url.pathname)) {
    try {
      const credentials = validateCredentials(await readJsonBody(req));
      let user;
      if (url.pathname === '/api/login-vulnerable') {
        // INTENTIONALLY VULNERABLE: direct string concatenation enables SQL injection.
        // This path uses the fictional plaintext demo field solely to reproduce the flaw.
        const sql = `SELECT id, username, role FROM users WHERE username = '${credentials.username}' AND password = '${credentials.password}' LIMIT 1`;
        user = db.prepare(sql).get();
      } else {
        // SAFE MODE: parameterized username lookup + scrypt password-hash verification.
        const record = findUserByUsername.get(credentials.username);
        if (record && verifyPassword(credentials.password, record.password_salt, record.password_hash)) {
          user = { id: record.id, username: record.username, role: record.role };
        }
      }

      if (!user) return sendJson(res, 401, { ok: false, message: 'Login rejected. Invalid username or password.' });
      return sendJson(res, 200, { ok: true, message: 'Login accepted.', user });
    } catch (error) {
      const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
      sendJson(res, statusCode, { ok: false, error: statusCode < 500 ? error.message : 'Request could not be processed.' });
    }
    return;
  }
  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`SQL injection lab running at http://${HOST}:${PORT}`);
  console.log('Fictional classroom data only. Never expose this intentionally vulnerable lab publicly.');
});
function shutdown() { server.close(() => { db.close(); process.exit(0); }); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
