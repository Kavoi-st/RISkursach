package com.marketplace.application.services;

import com.marketplace.application.exceptions.BusinessException;
import com.marketplace.application.exceptions.NotFoundException;
import com.marketplace.domain.entities.Order;
import com.marketplace.domain.entities.SellerRating;
import com.marketplace.domain.entities.User;
import com.marketplace.infrastructure.repositories.OrderRepository;
import com.marketplace.infrastructure.repositories.SellerRatingRepository;
import com.marketplace.infrastructure.repositories.UserRepository;
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
public class SellerRatingService {

    private final SellerRatingRepository sellerRatingRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public SellerRating rateSeller(UUID sellerId,
                                   UUID buyerId,
                                   UUID orderId,
                                   short score,
                                   String comment) {

        if (score < 1 || score > 5) {
            throw new BusinessException("Score must be between 1 and 5");
        }

        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new NotFoundException("Seller not found: " + sellerId));

        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new NotFoundException("Buyer not found: " + buyerId));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));

        if (sellerRatingRepository.existsBySellerAndBuyerAndOrder(seller, buyer, order)) {
            throw new BusinessException("Seller already rated for this order");
        }

        SellerRating rating = SellerRating.builder()
                .id(UUID.randomUUID())
                .seller(seller)
                .buyer(buyer)
                .order(order)
                .score(score)
                .comment(comment)
                .createdAt(OffsetDateTime.now())
                .build();

        return sellerRatingRepository.save(rating);
    }

    @Transactional(readOnly = true)
    public Page<SellerRating> getRatingsForSeller(UUID sellerId, Pageable pageable) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new NotFoundException("Seller not found: " + sellerId));

        return sellerRatingRepository.findAllBySeller(seller, pageable);
    }
}

