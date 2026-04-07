package com.marketplace.presentation.controllers;

import com.marketplace.application.services.SellerRatingService;
import com.marketplace.domain.entities.SellerRating;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/seller-ratings")
@RequiredArgsConstructor
@Validated
public class SellerRatingController {

    private final SellerRatingService sellerRatingService;

    @PostMapping
    public ResponseEntity<SellerRatingResponse> rateSeller(@Valid @RequestBody SellerRatingCreateRequest request) {
        SellerRating rating = sellerRatingService.rateSeller(
                UUID.fromString(request.getSellerId()),
                UUID.fromString(request.getBuyerId()),
                UUID.fromString(request.getOrderId()),
                request.getScore(),
                request.getComment()
        );
        return ResponseEntity.ok(SellerRatingResponse.from(rating));
    }

    @GetMapping
    public ResponseEntity<ProductController.PageResponse<SellerRatingResponse>> getRatingsForSeller(
            @RequestParam("sellerId") @NotBlank String sellerId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<SellerRating> ratingPage =
                sellerRatingService.getRatingsForSeller(UUID.fromString(sellerId), pageable);
        List<SellerRatingResponse> content = ratingPage.map(SellerRatingResponse::from).getContent();
        return ResponseEntity.ok(
                ProductController.PageResponse.of(
                        content,
                        ratingPage.getNumber(),
                        ratingPage.getSize(),
                        ratingPage.getTotalElements(),
                        ratingPage.getTotalPages()
                )
        );
    }

    @Data
    public static class SellerRatingCreateRequest {
        @NotBlank
        private String sellerId;
        @NotBlank
        private String buyerId;
        @NotBlank
        private String orderId;
        @Min(1)
        @Max(5)
        private short score;
        private String comment;
    }

    @Data
    public static class SellerRatingResponse {
        @NotNull
        private UUID id;
        @NotNull
        private UUID sellerId;
        @NotNull
        private UUID buyerId;
        @NotNull
        private UUID orderId;
        private Short score;
        private String comment;
        private OffsetDateTime createdAt;

        public static SellerRatingResponse from(SellerRating rating) {
            SellerRatingResponse dto = new SellerRatingResponse();
            dto.setId(rating.getId());
            dto.setSellerId(rating.getSeller().getId());
            dto.setBuyerId(rating.getBuyer().getId());
            dto.setOrderId(rating.getOrder().getId());
            dto.setScore(rating.getScore());
            dto.setComment(rating.getComment());
            dto.setCreatedAt(rating.getCreatedAt());
            return dto;
        }
    }
}

