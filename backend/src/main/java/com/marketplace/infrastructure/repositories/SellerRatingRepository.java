package com.marketplace.infrastructure.repositories;

import com.marketplace.domain.entities.Order;
import com.marketplace.domain.entities.SellerRating;
import com.marketplace.domain.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SellerRatingRepository extends JpaRepository<SellerRating, UUID> {

    Page<SellerRating> findAllBySeller(User seller, Pageable pageable);

    Page<SellerRating> findAllByBuyer(User buyer, Pageable pageable);

    List<SellerRating> findBySeller(User seller);

    boolean existsBySellerAndBuyerAndOrder(User seller, User buyer, Order order);
}

