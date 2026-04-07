CREATE TABLE IF NOT EXISTS orders (
    id                  UUID PRIMARY KEY,
    buyer_id            UUID NOT NULL,
    total_amount        NUMERIC(12, 2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'USD',
    status              VARCHAR(32) NOT NULL,
    shipping_country    VARCHAR(100) NOT NULL,
    shipping_city       VARCHAR(100) NOT NULL,
    shipping_street     VARCHAR(255) NOT NULL,
    shipping_zip        VARCHAR(20) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_orders_buyer
        FOREIGN KEY (buyer_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS order_items (
    id                      UUID PRIMARY KEY,
    order_id                UUID NOT NULL,
    product_id              UUID NOT NULL,
    seller_id               UUID NOT NULL,
    product_name_snapshot   VARCHAR(255) NOT NULL,
    unit_price              NUMERIC(12, 2) NOT NULL,
    currency                VARCHAR(3) NOT NULL DEFAULT 'USD',
    quantity                INTEGER NOT NULL,
    subtotal                NUMERIC(12, 2) NOT NULL,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT,
    CONSTRAINT fk_order_items_seller
        FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders (buyer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

