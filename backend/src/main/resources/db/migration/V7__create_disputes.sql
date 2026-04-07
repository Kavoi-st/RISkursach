CREATE TABLE IF NOT EXISTS disputes (
    id                  UUID PRIMARY KEY,
    order_id            UUID NOT NULL,
    opened_by_user_id   UUID NOT NULL,
    against_seller_id   UUID NOT NULL,
    resolved_by_user_id UUID,
    status              VARCHAR(32) NOT NULL,
    reason              VARCHAR(255) NOT NULL,
    description         TEXT,
    resolution_comment  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_disputes_order
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_disputes_opened_by
        FOREIGN KEY (opened_by_user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_disputes_against_seller
        FOREIGN KEY (against_seller_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_disputes_resolved_by
        FOREIGN KEY (resolved_by_user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS messages (
    id          UUID PRIMARY KEY,
    dispute_id  UUID NOT NULL,
    sender_id   UUID NOT NULL,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_messages_dispute
        FOREIGN KEY (dispute_id) REFERENCES disputes (id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender
        FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes (status);
CREATE INDEX IF NOT EXISTS idx_messages_dispute_id ON messages (dispute_id);

