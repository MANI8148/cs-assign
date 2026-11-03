import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync } from 'node:crypto';
import { readFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const databaseDir = resolve(projectRoot, 'database');
const databasePath = resolve(databaseDir, 'lab.db');
mkdirSync(databaseDir, { recursive: true });
rmSync(databasePath, { force: true });

const db = new DatabaseSync(databasePath);
try {
  db.exec(readFileSync(resolve(databaseDir, 'schema.sql'), 'utf8'));
  db.exec(readFileSync(resolve(databaseDir, 'seed.sql'), 'utf8'));
  const users = db.prepare('SELECT id, password FROM users');
  const update = db.prepare('UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?');
  for (const user of users.all()) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(user.password, salt, 64).toString('hex');
    update.run(salt, hash, user.id);
  }
  console.log(`Created and seeded SQLite database with scrypt hashes: ${databasePath}`);
} finally {
  db.close();
}
