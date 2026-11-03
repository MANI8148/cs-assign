-- Fictional lab credentials. Plaintext is retained ONLY for the vulnerable demo.
INSERT OR IGNORE INTO users (username, password, password_salt, password_hash, role) VALUES
('admin', 'Adm1nLab!', '', '', 'admin'),
('student', 'StudentLab!', '', '', 'student'),
('viewer', 'ViewerLab!', '', '', 'viewer');
