package com.marketplace.application.services;

import com.marketplace.application.exceptions.BusinessException;
import com.marketplace.application.exceptions.NotFoundException;
import com.marketplace.domain.entities.Order;
import com.marketplace.domain.entities.OrderItem;
import com.marketplace.domain.entities.Product;
import com.marketplace.domain.entities.User;
import com.marketplace.infrastructure.repositories.OrderItemRepository;
import com.marketplace.infrastructure.repositories.OrderRepository;
import com.marketplace.infrastructure.repositories.ProductRepository;
import com.marketplace.infrastructure.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public Order createOrder(UUID buyerId,
                             List<UUID> productIds,
                             String shippingCountry,
                             String shippingCity,
                             String shippingStreet,
                             String shippingZip) {

        if (productIds == null || productIds.isEmpty()) {
            throw new BusinessException("Order must contain at least one product");
        }

        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new NotFoundException("Buyer not found: " + buyerId));

        OffsetDateTime now = OffsetDateTime.now();

        Order order = Order.builder()
                .id(UUID.randomUUID())
                .buyer(buyer)
                .status("CREATED")
                .shippingCountry(shippingCountry)
                .shippingCity(shippingCity)
                .shippingStreet(shippingStreet)
                .shippingZip(shippingZip)
                .createdAt(now)
                .updatedAt(now)
                .items(new ArrayList<>())
                .build();

        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();
        String orderCurrency = "BYN";

        for (UUID productId : productIds) {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new NotFoundException("Product not found: " + productId));

            if (!product.isActive() || product.getAvailableQuantity() <= 0) {
                throw new BusinessException("Product not available: " + productId);
            }

            if (items.isEmpty()) {
                orderCurrency = product.getCurrency();
            }

            OrderItem item = OrderItem.builder()
                    .id(UUID.randomUUID())
                    .order(order)
                    .product(product)
                    .seller(product.getSeller())
                    .productNameSnapshot(product.getName())
                    .unitPrice(product.getPrice())
                    .currency(product.getCurrency())
                    .quantity(1)
                    .subtotal(product.getPrice())
                    .build();

            items.add(item);
            total = total.add(product.getPrice());
        }

        order.setTotalAmount(total);
        order.setCurrency(orderCurrency);
        order.setItems(items);

        Order savedOrder = orderRepository.save(order);
        orderItemRepository.saveAll(items);

        return savedOrder;
    }

    @Transactional(readOnly = true)
    public Page<Order> getOrdersForBuyer(UUID buyerId, Pageable pageable) {
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new NotFoundException("Buyer not found: " + buyerId));
        Page<Order> page = orderRepository.findAllByBuyer(buyer, pageable);
        page.getContent().forEach(o -> o.getItems().size());
        return page;
    }

    public Order changeStatus(UUID orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));

        if ("CANCELLED".equals(order.getStatus()) || "DELIVERED".equals(order.getStatus())) {
            throw new BusinessException("Cannot change status of finished order");
        }

        order.setStatus(newStatus);
        order.setUpdatedAt(OffsetDateTime.now());
        return orderRepository.save(order);
    }

    /**
     * Покупатель: CREATED → PAID (демо-оплата). Админ/модератор: любой переход кроме завершённых.
     */
    public Order changeStatusForActor(UUID orderId, User actor, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));

        String role = actor.getRole() != null ? actor.getRole().toUpperCase() : "BUYER";
        boolean staff = "ADMIN".equals(role) || "MODERATOR".equals(role);
        boolean buyer = order.getBuyer().getId().equals(actor.getId());

        if (!buyer && !staff) {
            throw new BusinessException("Нет прав на изменение заказа");
        }

        if (buyer && !staff) {
            if (!"CREATED".equals(order.getStatus()) || !"PAID".equals(newStatus)) {
                throw new BusinessException("Покупатель может только отметить оплату (CREATED → PAID)");
            }
        }

        return changeStatus(orderId, newStatus);
    }

    @Transactional(readOnly = true)
    public Order getOrderForUser(UUID orderId, User viewer) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        String role = viewer.getRole() != null ? viewer.getRole().toUpperCase() : "BUYER";
        boolean staff = "ADMIN".equals(role) || "MODERATOR".equals(role);
        if (!staff && !order.getBuyer().getId().equals(viewer.getId())) {
            throw new BusinessException("Нет доступа к заказу");
        }
        order.getItems().size();
        return order;
    }
}

