package com.marketplace.infrastructure.repositories;

import com.marketplace.domain.entities.Dispute;
import com.marketplace.domain.entities.Order;
import com.marketplace.domain.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.UUID;

public interface DisputeRepository extends JpaRepository<Dispute, UUID> {

    Page<Dispute> findAllByOrder(Order order, Pageable pageable);

    Page<Dispute> findAllByOpenedBy(User openedBy, Pageable pageable);

    Page<Dispute> findAllByAgainstSeller(User seller, Pageable pageable);

    Page<Dispute> findAllByStatus(String status, Pageable pageable);

    boolean existsByOrderAndStatusIn(Order order, Collection<String> statuses);

    @Query("SELECT d FROM Dispute d WHERE d.openedBy = :u OR d.againstSeller = :u ORDER BY d.createdAt DESC")
    Page<Dispute> findAllInvolvingUser(@Param("u") User user, Pageable pageable);
}

