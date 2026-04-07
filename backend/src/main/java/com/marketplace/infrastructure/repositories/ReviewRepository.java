package com.marketplace.infrastructure.repositories;

import com.marketplace.domain.entities.Product;
import com.marketplace.domain.entities.Review;
import com.marketplace.domain.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    Page<Review> findAllByProduct(Product product, Pageable pageable);

    Page<Review> findAllByAuthor(User author, Pageable pageable);

    boolean existsByProductAndAuthor(Product product, User author);
}

