ALTER TABLE sessions ADD COLUMN refresh_hash TEXT;
ALTER TABLE sessions ADD COLUMN refresh_expires_at TIMESTAMPTZ(6);
CREATE UNIQUE INDEX sessions_refresh_hash_key ON sessions(refresh_hash);
