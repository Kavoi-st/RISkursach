ALTER TABLE products
    ADD COLUMN IF NOT EXISTS city VARCHAR(120),
    ADD COLUMN IF NOT EXISTS district VARCHAR(120),
    ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Категория по умолчанию для объявлений (стабильный UUID для клиента)
INSERT INTO categories (id, name, slug, parent_id, created_at, updated_at)
SELECT '11111111-1111-1111-1111-111111111101'::uuid,
       'Объявления',
       'obyavleniya',
       NULL,
       NOW(),
       NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'obyavleniya');
