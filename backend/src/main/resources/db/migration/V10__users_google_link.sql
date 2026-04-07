ALTER TABLE users
    ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255),
    ADD COLUMN IF NOT EXISTS google_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS google_linked_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_google_sub ON users (google_sub) WHERE google_sub IS NOT NULL;

