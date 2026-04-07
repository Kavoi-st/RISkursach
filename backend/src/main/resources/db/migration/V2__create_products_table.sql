CREATE TABLE IF NOT EXISTS products (
    id                  UUID PRIMARY KEY,
    seller_id           UUID NOT NULL,
    category_id         UUID NOT NULL,
    name                VARCHAR(255) NOT NULL,
    description         TEXT NOT NULL,
    price               NUMERIC(12, 2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'USD',
    available_quantity  INTEGER NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    average_rating      NUMERIC(3, 2),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_products_seller
        FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products (seller_id);

