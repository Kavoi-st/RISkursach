package com.marketplace.presentation.controllers;

import com.marketplace.application.services.OrderService;
import com.marketplace.domain.entities.Order;
import com.marketplace.domain.entities.OrderItem;
import com.marketplace.domain.entities.User;
import com.marketplace.infrastructure.repositories.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Validated
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrderResponse> createOrder(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody OrderCreateRequest request
    ) {
        User buyer = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Order order = orderService.createOrder(
                buyer.getId(),
                request.getProductIds().stream().map(UUID::fromString).toList(),
                request.getShippingCountry(),
                request.getShippingCity(),
                request.getShippingStreet(),
                request.getShippingZip()
        );
        return ResponseEntity.ok(OrderResponse.from(order));
    }

    @GetMapping("/mine")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProductController.PageResponse<OrderResponse>> listMyOrders(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size
    ) {
        User buyer = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Order> orderPage = orderService.getOrdersForBuyer(buyer.getId(), pageable);
        List<OrderResponse> content = orderPage.map(OrderResponse::from).getContent();
        return ResponseEntity.ok(ProductController.PageResponse.of(
                content,
                orderPage.getNumber(),
                orderPage.getSize(),
                orderPage.getTotalElements(),
                orderPage.getTotalPages()
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrderResponse> getOrder(
            @PathVariable("id") @NotBlank String id,
            @AuthenticationPrincipal UserDetails principal
    ) {
        User viewer = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Order order = orderService.getOrderForUser(UUID.fromString(id), viewer);
        return ResponseEntity.ok(OrderResponse.from(order));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OrderResponse> changeStatus(
            @PathVariable("id") @NotBlank String id,
            @RequestParam("status") @NotBlank String status,
            @AuthenticationPrincipal UserDetails principal
    ) {
        User actor = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Order order = orderService.changeStatusForActor(UUID.fromString(id), actor, status);
        return ResponseEntity.ok(OrderResponse.from(order));
    }

    @Data
    public static class OrderCreateRequest {
        @NotEmpty
        private List<String> productIds;
        @NotBlank
        private String shippingCountry;
        @NotBlank
        private String shippingCity;
        @NotBlank
        private String shippingStreet;
        @NotBlank
        private String shippingZip;
    }

    @Data
    public static class OrderLineResponse {
        private UUID productId;
        private String productName;
        private UUID sellerId;
        private BigDecimal unitPrice;
        private String currency;
        private Integer quantity;
    }

    @Data
    public static class OrderResponse {
        @NotNull
        private UUID id;
        @NotNull
        private UUID buyerId;
        @NotNull
        private BigDecimal totalAmount;
        @NotBlank
        private String currency;
        @NotBlank
        private String status;
        private List<OrderLineResponse> lines;

        public static OrderResponse from(Order order) {
            OrderResponse dto = new OrderResponse();
            dto.setId(order.getId());
            dto.setBuyerId(order.getBuyer().getId());
            dto.setTotalAmount(order.getTotalAmount());
            dto.setCurrency(order.getCurrency());
            dto.setStatus(order.getStatus());
            dto.setLines(order.getItems().stream().map(OrderController::toLine).toList());
            return dto;
        }
    }

    private static OrderLineResponse toLine(OrderItem item) {
        OrderLineResponse line = new OrderLineResponse();
        line.setProductId(item.getProduct().getId());
        line.setProductName(item.getProductNameSnapshot());
        line.setSellerId(item.getSeller().getId());
        line.setUnitPrice(item.getUnitPrice());
        line.setCurrency(item.getCurrency());
        line.setQuantity(item.getQuantity());
        return line;
    }
}
