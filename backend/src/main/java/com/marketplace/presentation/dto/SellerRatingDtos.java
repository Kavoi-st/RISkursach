package com.marketplace.presentation.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class SellerRatingDtos {

    public record SellerRatingCreateRequest(
            UUID sellerId,
            UUID buyerId,
            UUID orderId,
            short score,
            String comment
    ) {
    }

    public record SellerRatingResponse(
            UUID id,
            UUID sellerId,
            UUID buyerId,
            UUID orderId,
            short score,
            String comment,
            OffsetDateTime createdAt
    ) {
    }
}

