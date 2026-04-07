package com.marketplace.application.services;

import com.marketplace.application.exceptions.BusinessException;
import com.marketplace.application.exceptions.NotFoundException;
import com.marketplace.domain.entities.Order;
import com.marketplace.domain.entities.Product;
import com.marketplace.domain.entities.Review;
import com.marketplace.domain.entities.User;
import com.marketplace.infrastructure.repositories.OrderItemRepository;
import com.marketplace.infrastructure.repositories.OrderRepository;
import com.marketplace.infrastructure.repositories.ProductRepository;
import com.marketplace.infrastructure.repositories.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    /**
     * Отзыв с текстом (комментарий). Заказ опционален: если указан — проверяется покупатель и состав заказа.
     */
    public Review createReview(UUID productId,
                               User author,
                               UUID orderIdOpt,
                               short rating,
                               String comment) {

        if (rating < 1 || rating > 5) {
            throw new BusinessException("Оценка от 1 до 5");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found: " + productId));

        if (product.getSeller().getId().equals(author.getId())) {
            throw new BusinessException("Нельзя оставить отзыв на свой товар");
        }

        if (reviewRepository.existsByProductAndAuthor(product, author)) {
            throw new BusinessException("Вы уже оставляли отзыв на этот товар");
        }

        Order orderLink = null;
        if (orderIdOpt != null) {
            Order order = orderRepository.findById(orderIdOpt)
                    .orElseThrow(() -> new NotFoundException("Order not found: " + orderIdOpt));
            if (!order.getBuyer().getId().equals(author.getId())) {
                throw new BusinessException("Заказ не принадлежит вам");
            }
            if (!orderItemRepository.existsByOrderAndProduct(order, product)) {
                throw new BusinessException("Этого товара нет в указанном заказе");
            }
            orderLink = order;
        }

        Review review = Review.builder()
                .id(UUID.randomUUID())
                .product(product)
                .author(author)
                .order(orderLink)
                .rating(rating)
                .comment(comment)
                .createdAt(OffsetDateTime.now())
                .build();

        return reviewRepository.save(review);
    }

    @Transactional(readOnly = true)
    public Page<Review> getReviewsForProduct(UUID productId, Pageable pageable) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found: " + productId));
        return reviewRepository.findAllByProduct(product, pageable);
    }
}
