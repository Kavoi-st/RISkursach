package com.marketplace.infrastructure.repositories;

import com.marketplace.domain.entities.Order;
import com.marketplace.domain.entities.OrderItem;
import com.marketplace.domain.entities.Product;
import com.marketplace.domain.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {

    boolean existsByOrderAndProduct(Order order, Product product);

    List<OrderItem> findAllByOrder(Order order);

    Page<OrderItem> findAllBySeller(User seller, Pageable pageable);

    Page<OrderItem> findAllByProduct(Product product, Pageable pageable);
}

