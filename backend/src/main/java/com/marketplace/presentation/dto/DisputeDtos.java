package com.marketplace.presentation.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class DisputeDtos {

    public record DisputeCreateRequest(
            UUID orderId,
            UUID openedByUserId,
            UUID againstSellerId,
            String reason,
            String description
    ) {
    }

    public record DisputeResolveRequest(
            UUID moderatorId,
            String finalStatus,
            String resolutionComment
    ) {
    }

    public record MessageCreateRequest(
            UUID senderId,
            String content
    ) {
    }

    public record DisputeResponse(
            UUID id,
            UUID orderId,
            UUID openedByUserId,
            UUID againstSellerId,
            String status,
            String reason,
            String description,
            String resolutionComment,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {
    }

    public record MessageResponse(
            UUID id,
            UUID disputeId,
            UUID senderId,
            String content,
            OffsetDateTime createdAt
    ) {
    }
}

