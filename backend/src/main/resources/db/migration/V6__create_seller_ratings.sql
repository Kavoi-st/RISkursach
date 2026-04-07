CREATE TABLE IF NOT EXISTS seller_ratings (
    id          UUID PRIMARY KEY,
    seller_id   UUID NOT NULL,
    buyer_id    UUID NOT NULL,
    order_id    UUID NOT NULL,
    score       SMALLINT NOT NULL,
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_seller_ratings_seller
        FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_seller_ratings_buyer
        FOREIGN KEY (buyer_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_seller_ratings_order
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT uq_seller_ratings_seller_buyer_order
        UNIQUE (seller_id, buyer_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_seller_ratings_seller_id ON seller_ratings (seller_id);

