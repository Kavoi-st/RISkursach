package com.marketplace.infrastructure.repositories;

import com.marketplace.domain.entities.Order;
import com.marketplace.domain.entities.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Page<Payment> findAllByOrder(Order order, Pageable pageable);

    Page<Payment> findAllByStatus(String status, Pageable pageable);
}

