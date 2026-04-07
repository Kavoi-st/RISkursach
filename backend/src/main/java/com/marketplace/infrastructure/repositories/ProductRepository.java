package com.marketplace.infrastructure.repositories;

import com.marketplace.domain.entities.Category;
import com.marketplace.domain.entities.Product;
import com.marketplace.domain.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    Page<Product> findAllByActiveTrue(Pageable pageable);

    Page<Product> findAllByCategoryAndActiveTrue(Category category, Pageable pageable);

    Page<Product> findAllBySellerAndActiveTrue(User seller, Pageable pageable);

    Page<Product> findAllBySellerOrderByCreatedAtDesc(User seller, Pageable pageable);
}

