package com.marketplace.application.services;

import com.marketplace.application.exceptions.BusinessException;
import com.marketplace.application.exceptions.NotFoundException;
import com.marketplace.domain.entities.Category;
import com.marketplace.domain.entities.Product;
import com.marketplace.domain.entities.User;
import com.marketplace.infrastructure.repositories.CategoryRepository;
import com.marketplace.infrastructure.repositories.ProductRepository;
import com.marketplace.infrastructure.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public Product createProduct(UUID sellerId,
                                 UUID categoryId,
                                 String name,
                                 String description,
                                 BigDecimal price,
                                 String currency,
                                 int availableQuantity,
                                 String city,
                                 String district,
                                 String imageUrl) {

        if (price == null || price.signum() <= 0) {
            throw new BusinessException("Price must be positive");
        }
        if (availableQuantity < 0) {
            throw new BusinessException("Quantity cannot be negative");
        }
        if (city == null || city.isBlank()) {
            throw new BusinessException("City is required");
        }
        if (district == null || district.isBlank()) {
            throw new BusinessException("District is required");
        }

        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new NotFoundException("Seller not found: " + sellerId));

        String role = seller.getRole() != null ? seller.getRole().toUpperCase() : "";
        if (!"SELLER".equals(role) && !"ADMIN".equals(role)) {
            throw new BusinessException("Публиковать объявления могут только продавцы");
        }

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException("Category not found: " + categoryId));

        OffsetDateTime now = OffsetDateTime.now();

        Product product = Product.builder()
                .id(UUID.randomUUID())
                .seller(seller)
                .category(category)
                .name(name)
                .description(description)
                .price(price)
                .currency(currency)
                .availableQuantity(availableQuantity)
                .active(true)
                .city(city.trim())
                .district(district.trim())
                .imageUrl(imageUrl != null && !imageUrl.isBlank() ? imageUrl.trim() : null)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public Page<Product> listActiveProducts(Pageable pageable) {
        return productRepository.findAllByActiveTrue(pageable);
    }

    @Transactional(readOnly = true)
    public Product getActiveProduct(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found: " + productId));
        if (!product.isActive()) {
            throw new NotFoundException("Product not found: " + productId);
        }
        return product;
    }

    @Transactional(readOnly = true)
    public Page<Product> listSellerProducts(UUID sellerId, Pageable pageable) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new NotFoundException("Seller not found: " + sellerId));
        return productRepository.findAllBySellerOrderByCreatedAtDesc(seller, pageable);
    }

    private boolean canModifyProduct(User actor, Product product) {
        String r = actor.getRole() != null ? actor.getRole().toUpperCase() : "";
        if ("ADMIN".equals(r)) {
            return true;
        }
        return product.getSeller().getId().equals(actor.getId());
    }

    public Product updateProductForActor(User actor,
                                         UUID productId,
                                         String name,
                                         String description,
                                         BigDecimal price,
                                         Integer availableQuantity) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found: " + productId));

        if (!canModifyProduct(actor, product)) {
            throw new BusinessException("Нет прав на изменение этого товара");
        }

        if (name != null && !name.isBlank()) {
            product.setName(name);
        }
        if (description != null && !description.isBlank()) {
            product.setDescription(description);
        }
        if (price != null) {
            if (price.signum() <= 0) {
                throw new BusinessException("Price must be positive");
            }
            product.setPrice(price);
        }
        if (availableQuantity != null) {
            if (availableQuantity < 0) {
                throw new BusinessException("Quantity cannot be negative");
            }
            product.setAvailableQuantity(availableQuantity);
        }

        product.setUpdatedAt(OffsetDateTime.now());
        return productRepository.save(product);
    }

    public void deactivateProductForActor(User actor, UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found: " + productId));
        if (!canModifyProduct(actor, product)) {
            throw new BusinessException("Нет прав на снятие этого товара с публикации");
        }
        product.setActive(false);
        product.setUpdatedAt(OffsetDateTime.now());
        productRepository.save(product);
    }
}

