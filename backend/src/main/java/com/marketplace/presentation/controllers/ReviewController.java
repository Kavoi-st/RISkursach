package com.marketplace.presentation.controllers;

import com.marketplace.application.services.ReviewService;
import com.marketplace.domain.entities.Review;
import com.marketplace.domain.entities.User;
import com.marketplace.infrastructure.repositories.UserRepository;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
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
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
@Validated
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReviewResponse> createReview(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody ReviewCreateRequest request
    ) {
        User author = userRepository.findByEmail(principal.getUsername())
                .orElseThrow();
        UUID orderIdOpt = request.getOrderId() != null && !request.getOrderId().isBlank()
                ? UUID.fromString(request.getOrderId())
                : null;
        Review review = reviewService.createReview(
                UUID.fromString(request.getProductId()),
                author,
                orderIdOpt,
                request.getRating(),
                request.getComment()
        );
        return ResponseEntity.ok(ReviewResponse.from(review));
    }

    @GetMapping
    public ResponseEntity<ProductController.PageResponse<ReviewResponse>> getReviewsForProduct(
            @RequestParam("productId") @NotBlank String productId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Review> reviewPage = reviewService.getReviewsForProduct(UUID.fromString(productId), pageable);
        List<ReviewResponse> content = reviewPage.map(ReviewResponse::from).getContent();
        return ResponseEntity.ok(
                ProductController.PageResponse.of(
                        content,
                        reviewPage.getNumber(),
                        reviewPage.getSize(),
                        reviewPage.getTotalElements(),
                        reviewPage.getTotalPages()
                )
        );
    }

    @Data
    public static class ReviewCreateRequest {
        @NotBlank
        private String productId;
        /** Если указан — проверяется, что товар в заказе и заказ ваш */
        private String orderId;
        @Min(1)
        @Max(5)
        private short rating;
        private String comment;
    }

    @Data
    public static class ReviewResponse {
        @NotNull
        private UUID id;
        @NotNull
        private UUID productId;
        @NotNull
        private UUID authorId;
        private String authorFullName;
        private Short rating;
        private String comment;
        private OffsetDateTime createdAt;

        public static ReviewResponse from(Review review) {
            ReviewResponse dto = new ReviewResponse();
            dto.setId(review.getId());
            dto.setProductId(review.getProduct().getId());
            dto.setAuthorId(review.getAuthor().getId());
            dto.setAuthorFullName(review.getAuthor().getFullName());
            dto.setRating(review.getRating());
            dto.setComment(review.getComment());
            dto.setCreatedAt(review.getCreatedAt());
            return dto;
        }
    }
}
