package com.marketplace.presentation.controllers;

import com.marketplace.application.services.ProductService;
import com.marketplace.domain.entities.Product;
import com.marketplace.domain.entities.User;
import com.marketplace.infrastructure.repositories.UserRepository;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Validated
public class ProductController {

    private final ProductService productService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<PageResponse<ProductResponse>> listProducts(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Product> productPage = productService.listActiveProducts(pageable);
        List<ProductResponse> content = productPage.map(ProductResponse::from).getContent();

        PageResponse<ProductResponse> response = PageResponse.of(
                content,
                productPage.getNumber(),
                productPage.getSize(),
                productPage.getTotalElements(),
                productPage.getTotalPages()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/mine")
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<PageResponse<ProductResponse>> myProducts(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "50") @Min(1) int size
    ) {
        User seller = userRepository.findByEmail(principal.getUsername())
                .orElseThrow();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Product> productPage = productService.listSellerProducts(seller.getId(), pageable);
        List<ProductResponse> content = productPage.map(ProductResponse::from).getContent();
        return ResponseEntity.ok(PageResponse.of(
                content,
                productPage.getNumber(),
                productPage.getSize(),
                productPage.getTotalElements(),
                productPage.getTotalPages()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProduct(@PathVariable("id") @NotBlank String id) {
        Product product = productService.getActiveProduct(UUID.fromString(id));
        return ResponseEntity.ok(ProductResponse.from(product));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<ProductResponse> createProduct(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody ProductCreateRequest request
    ) {
        User seller = userRepository.findByEmail(principal.getUsername())
                .orElseThrow();
        Product product = productService.createProduct(
                seller.getId(),
                UUID.fromString(request.getCategoryId()),
                request.getName(),
                request.getDescription(),
                request.getPrice(),
                request.getCurrency(),
                request.getAvailableQuantity(),
                request.getCity(),
                request.getDistrict(),
                request.getImageUrl()
        );
        return ResponseEntity.ok(ProductResponse.from(product));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<ProductResponse> updateProduct(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable("id") @NotBlank String id,
            @Valid @RequestBody ProductUpdateRequest request
    ) {
        User actor = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Product product = productService.updateProductForActor(
                actor,
                UUID.fromString(id),
                request.getName(),
                request.getDescription(),
                request.getPrice(),
                request.getAvailableQuantity()
        );
        return ResponseEntity.ok(ProductResponse.from(product));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SELLER','ADMIN')")
    public ResponseEntity<Void> deactivateProduct(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable("id") @NotBlank String id
    ) {
        User actor = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        productService.deactivateProductForActor(actor, UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class ProductCreateRequest {
        @NotBlank
        private String categoryId;
        @NotBlank
        private String name;
        @NotBlank
        private String description;
        @NotNull
        private BigDecimal price;
        @NotBlank
        private String currency;
        @Min(0)
        private int availableQuantity;
        @NotBlank
        private String city;
        @NotBlank
        private String district;
        /** Опционально: URL или data URL изображения */
        private String imageUrl;
    }

    @Data
    public static class ProductUpdateRequest {
        private String name;
        private String description;
        private BigDecimal price;
        private Integer availableQuantity;
    }

    @Data
    public static class ProductResponse {
        @NotNull
        private UUID id;
        @NotNull
        private UUID sellerId;
        private String sellerFullName;
        @NotNull
        private UUID categoryId;
        private String name;
        private String description;
        private BigDecimal price;
        private String currency;
        private Integer availableQuantity;
        private boolean active;
        private String city;
        private String district;
        private String imageUrl;

        public static ProductResponse from(Product product) {
            ProductResponse dto = new ProductResponse();
            dto.setId(product.getId());
            dto.setSellerId(product.getSeller().getId());
            dto.setSellerFullName(product.getSeller().getFullName());
            dto.setCategoryId(product.getCategory().getId());
            dto.setName(product.getName());
            dto.setDescription(product.getDescription());
            dto.setPrice(product.getPrice());
            dto.setCurrency(product.getCurrency());
            dto.setAvailableQuantity(product.getAvailableQuantity());
            dto.setActive(product.isActive());
            dto.setCity(product.getCity());
            dto.setDistrict(product.getDistrict());
            dto.setImageUrl(product.getImageUrl());
            return dto;
        }
    }

    @Data
    public static class PageResponse<T> {
        private List<T> content;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;

        public static <T> PageResponse<T> of(List<T> content, int page, int size, long totalElements, int totalPages) {
            PageResponse<T> resp = new PageResponse<>();
            resp.setContent(content);
            resp.setPage(page);
            resp.setSize(size);
            resp.setTotalElements(totalElements);
            resp.setTotalPages(totalPages);
            return resp;
        }
    }
}
