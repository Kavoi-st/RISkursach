package com.marketplace.presentation.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class OrderDtos {

    public record OrderCreateRequest(
            UUID buyerId,
            List<UUID> productIds,
            String shippingCountry,
            String shippingCity,
            String shippingStreet,
            String shippingZip
    ) {
    }

    public record OrderStatusUpdateRequest(
            String status
    ) {
    }

    public record OrderResponse(
            UUID id,
            UUID buyerId,
            BigDecimal totalAmount,
            String currency,
            String status
    ) {
    }
}

