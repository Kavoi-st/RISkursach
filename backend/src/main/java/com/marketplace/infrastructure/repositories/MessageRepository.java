package com.marketplace.infrastructure.repositories;

import com.marketplace.domain.entities.Dispute;
import com.marketplace.domain.entities.Message;
import com.marketplace.domain.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findAllByDisputeOrderByCreatedAtAsc(Dispute dispute);

    Page<Message> findAllByDisputeOrderByCreatedAtAsc(Dispute dispute, Pageable pageable);

    Page<Message> findAllBySender(User sender, Pageable pageable);
}

