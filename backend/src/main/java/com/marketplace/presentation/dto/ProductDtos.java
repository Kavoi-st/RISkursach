package com.marketplace.presentation.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class ProductDtos {

    public record ProductCreateRequest(
            UUID sellerId,
            UUID categoryId,
            String name,
            String description,
            BigDecimal price,
            String currency,
            int availableQuantity
    ) {
    }

    public record ProductUpdateRequest(
            String name,
            String description,
            BigDecimal price,
            Integer availableQuantity
    ) {
    }

    public record ProductResponse(
            UUID id,
            UUID sellerId,
            UUID categoryId,
            String name,
            String description,
            BigDecimal price,
            String currency,
            Integer availableQuantity,
            boolean active
    ) {
    }
}

