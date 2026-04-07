ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(32) NOT NULL DEFAULT 'BUYER';

UPDATE users SET role = 'ADMIN' WHERE LOWER(TRIM(email)) = 'admin@marketplace.local';
UPDATE users SET role = 'MODERATOR' WHERE LOWER(TRIM(email)) = 'moderator@marketplace.local';
UPDATE users
SET role = 'SELLER'
WHERE (store_name IS NOT NULL AND TRIM(store_name) <> '')
  AND LOWER(TRIM(email)) NOT IN ('admin@marketplace.local', 'moderator@marketplace.local');
