package com.marketplace.presentation.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ReviewDtos {

    public record ReviewCreateRequest(
            UUID productId,
            UUID authorId,
            UUID orderId,
            short rating,
            String comment
    ) {
    }

    public record ReviewResponse(
            UUID id,
            UUID productId,
            UUID authorId,
            UUID orderId,
            short rating,
            String comment,
            OffsetDateTime createdAt
    ) {
    }
}

