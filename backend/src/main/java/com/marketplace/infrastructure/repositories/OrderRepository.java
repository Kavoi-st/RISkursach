package com.marketplace.infrastructure.repositories;

import com.marketplace.domain.entities.Order;
import com.marketplace.domain.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    Page<Order> findAllByBuyer(User buyer, Pageable pageable);

    Page<Order> findAllByBuyerAndStatus(User buyer, String status, Pageable pageable);
}

