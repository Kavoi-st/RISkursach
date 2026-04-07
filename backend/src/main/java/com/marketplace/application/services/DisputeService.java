package com.marketplace.application.services;

import com.marketplace.application.exceptions.BusinessException;
import com.marketplace.application.exceptions.NotFoundException;
import com.marketplace.domain.entities.Dispute;
import com.marketplace.domain.entities.Message;
import com.marketplace.domain.entities.Order;
import com.marketplace.domain.entities.OrderItem;
import com.marketplace.domain.entities.User;
import com.marketplace.infrastructure.repositories.DisputeRepository;
import com.marketplace.infrastructure.repositories.MessageRepository;
import com.marketplace.infrastructure.repositories.OrderItemRepository;
import com.marketplace.infrastructure.repositories.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final MessageRepository messageRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    private static boolean isStaff(User user) {
        String r = user.getRole() != null ? user.getRole().toUpperCase() : "";
        return "ADMIN".equals(r) || "MODERATOR".equals(r);
    }

    private void ensureDisputeAccess(Dispute dispute, User viewer) {
        if (isStaff(viewer)) {
            return;
        }
        if (viewer.getId().equals(dispute.getOpenedBy().getId())) {
            return;
        }
        if (viewer.getId().equals(dispute.getAgainstSeller().getId())) {
            return;
        }
        throw new BusinessException("Нет доступа к спору");
    }

    public Dispute openDispute(UUID orderId, User openedBy, String reason, String description) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));

        if (!order.getBuyer().getId().equals(openedBy.getId())) {
            throw new BusinessException("Спор может открыть только покупатель заказа");
        }

        if ("CREATED".equals(order.getStatus())) {
            throw new BusinessException("Сначала отметьте оплату заказа, затем откройте спор");
        }

        List<OrderItem> items = orderItemRepository.findAllByOrder(order);
        if (items.isEmpty()) {
            throw new BusinessException("В заказе нет позиций");
        }

        if (disputeRepository.existsByOrderAndStatusIn(order, List.of("OPEN", "UNDER_REVIEW"))) {
            throw new BusinessException("По этому заказу уже есть открытый спор");
        }

        User againstSeller = items.get(0).getSeller();

        OffsetDateTime now = OffsetDateTime.now();

        Dispute dispute = Dispute.builder()
                .id(UUID.randomUUID())
                .order(order)
                .openedBy(openedBy)
                .againstSeller(againstSeller)
                .status("OPEN")
                .reason(reason)
                .description(description)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return disputeRepository.save(dispute);
    }

    public Message addMessage(UUID disputeId, User sender, String content) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new NotFoundException("Dispute not found: " + disputeId));

        if (!"OPEN".equals(dispute.getStatus()) && !"UNDER_REVIEW".equals(dispute.getStatus())) {
            throw new BusinessException("Спор закрыт для сообщений");
        }

        ensureDisputeAccess(dispute, sender);

        Message message = Message.builder()
                .id(UUID.randomUUID())
                .dispute(dispute)
                .sender(sender)
                .content(content)
                .createdAt(OffsetDateTime.now())
                .build();

        return messageRepository.save(message);
    }

    public Dispute resolveDispute(UUID disputeId,
                                  User moderator,
                                  String finalStatus,
                                  String resolutionComment) {

        if (!isStaff(moderator)) {
            throw new BusinessException("Только администратор или модератор может завершить спор");
        }

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new NotFoundException("Dispute not found: " + disputeId));

        if (!"OPEN".equals(dispute.getStatus()) && !"UNDER_REVIEW".equals(dispute.getStatus())) {
            throw new BusinessException("Спор уже завершён");
        }

        if (!"RESOLVED".equals(finalStatus) && !"REJECTED".equals(finalStatus)) {
            throw new BusinessException("Некорректный итоговый статус: " + finalStatus);
        }

        dispute.setStatus(finalStatus);
        dispute.setResolvedBy(moderator);
        dispute.setResolutionComment(resolutionComment);
        dispute.setUpdatedAt(OffsetDateTime.now());

        return disputeRepository.save(dispute);
    }

    public Dispute setUnderReview(UUID disputeId, User moderator) {
        if (!isStaff(moderator)) {
            throw new BusinessException("Только модератор может взять спор в работу");
        }
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new NotFoundException("Dispute not found: " + disputeId));
        if (!"OPEN".equals(dispute.getStatus())) {
            throw new BusinessException("Спор не в статусе OPEN");
        }
        dispute.setStatus("UNDER_REVIEW");
        dispute.setUpdatedAt(OffsetDateTime.now());
        return disputeRepository.save(dispute);
    }

    @Transactional(readOnly = true)
    public Page<Dispute> listDisputesByStatus(String status, Pageable pageable) {
        return disputeRepository.findAllByStatus(status, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Dispute> listInvolvingUser(User user, Pageable pageable) {
        return disputeRepository.findAllInvolvingUser(user, pageable);
    }

    @Transactional(readOnly = true)
    public Dispute getDisputeForViewer(UUID disputeId, User viewer) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new NotFoundException("Dispute not found: " + disputeId));
        ensureDisputeAccess(dispute, viewer);
        return dispute;
    }

    @Transactional(readOnly = true)
    public List<Message> listMessagesForViewer(UUID disputeId, User viewer) {
        Dispute dispute = getDisputeForViewer(disputeId, viewer);
        return messageRepository.findAllByDisputeOrderByCreatedAtAsc(dispute);
    }
}
