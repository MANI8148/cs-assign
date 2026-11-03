-- Fictional classroom accounts only. `password` exists solely to make the
-- intentionally vulnerable teaching endpoint reproducible. Never store plaintext
-- passwords in a real application. Safe mode uses password_salt + password_hash.
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL
);
