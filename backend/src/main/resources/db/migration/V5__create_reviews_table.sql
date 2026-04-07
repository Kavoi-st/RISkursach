CREATE TABLE IF NOT EXISTS reviews (
    id          UUID PRIMARY KEY,
    product_id  UUID NOT NULL,
    author_id   UUID NOT NULL,
    order_id    UUID,
    rating      SMALLINT NOT NULL,
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_reviews_product
        FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_author
        FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_reviews_order
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews (product_id);

