package com.marketplace.presentation.controllers;

import com.marketplace.application.services.DisputeService;
import com.marketplace.domain.entities.Dispute;
import com.marketplace.domain.entities.Message;
import com.marketplace.domain.entities.User;
import com.marketplace.infrastructure.repositories.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/disputes")
@RequiredArgsConstructor
@Validated
public class DisputeController {

    private final DisputeService disputeService;
    private final UserRepository userRepository;

    @GetMapping("/mine")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProductController.PageResponse<DisputeResponse>> myDisputes(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size
    ) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Dispute> disputePage = disputeService.listInvolvingUser(user, pageable);
        List<DisputeResponse> content = disputePage.map(DisputeResponse::from).getContent();
        return ResponseEntity.ok(ProductController.PageResponse.of(
                content,
                disputePage.getNumber(),
                disputePage.getSize(),
                disputePage.getTotalElements(),
                disputePage.getTotalPages()
        ));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<ProductController.PageResponse<DisputeResponse>> listForModerators(
            @RequestParam("status") @NotBlank String status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Dispute> disputePage = disputeService.listDisputesByStatus(status, pageable);
        List<DisputeResponse> content = disputePage.map(DisputeResponse::from).getContent();
        return ResponseEntity.ok(ProductController.PageResponse.of(
                content,
                disputePage.getNumber(),
                disputePage.getSize(),
                disputePage.getTotalElements(),
                disputePage.getTotalPages()
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DisputeDetailResponse> getDispute(
            @PathVariable("id") @NotBlank String id,
            @AuthenticationPrincipal UserDetails principal
    ) {
        User viewer = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Dispute dispute = disputeService.getDisputeForViewer(UUID.fromString(id), viewer);
        List<Message> messages = disputeService.listMessagesForViewer(UUID.fromString(id), viewer);
        DisputeDetailResponse resp = new DisputeDetailResponse();
        resp.setDispute(DisputeResponse.from(dispute));
        resp.setMessages(messages.stream().map(MessageResponse::from).toList());
        return ResponseEntity.ok(resp);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DisputeResponse> openDispute(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody DisputeCreateRequest request
    ) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Dispute dispute = disputeService.openDispute(
                UUID.fromString(request.getOrderId()),
                user,
                request.getReason(),
                request.getDescription()
        );
        return ResponseEntity.ok(DisputeResponse.from(dispute));
    }

    @PostMapping("/{id}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> addMessage(
            @PathVariable("id") @NotBlank String id,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody MessageCreateRequest request
    ) {
        User sender = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Message message = disputeService.addMessage(UUID.fromString(id), sender, request.getContent());
        return ResponseEntity.ok(MessageResponse.from(message));
    }

    @PostMapping("/{id}/under-review")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<DisputeResponse> underReview(
            @PathVariable("id") @NotBlank String id,
            @AuthenticationPrincipal UserDetails principal
    ) {
        User moderator = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Dispute dispute = disputeService.setUnderReview(UUID.fromString(id), moderator);
        return ResponseEntity.ok(DisputeResponse.from(dispute));
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN','MODERATOR')")
    public ResponseEntity<DisputeResponse> resolveDispute(
            @PathVariable("id") @NotBlank String id,
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody DisputeResolveRequest request
    ) {
        User moderator = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        Dispute dispute = disputeService.resolveDispute(
                UUID.fromString(id),
                moderator,
                request.getFinalStatus(),
                request.getResolutionComment()
        );
        return ResponseEntity.ok(DisputeResponse.from(dispute));
    }

    @Data
    public static class DisputeCreateRequest {
        @NotBlank
        private String orderId;
        @NotBlank
        private String reason;
        private String description;
    }

    @Data
    public static class MessageCreateRequest {
        @NotBlank
        private String content;
    }

    @Data
    public static class DisputeResolveRequest {
        @NotBlank
        private String finalStatus;
        private String resolutionComment;
    }

    @Data
    public static class DisputeDetailResponse {
        private DisputeResponse dispute;
        private List<MessageResponse> messages;
    }

    @Data
    public static class DisputeResponse {
        @NotNull
        private UUID id;
        @NotNull
        private UUID orderId;
        @NotNull
        private UUID openedByUserId;
        @NotNull
        private UUID againstSellerId;
        @NotBlank
        private String status;
        @NotBlank
        private String reason;
        private String description;
        private String resolutionComment;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;

        public static DisputeResponse from(Dispute dispute) {
            DisputeResponse dto = new DisputeResponse();
            dto.setId(dispute.getId());
            dto.setOrderId(dispute.getOrder().getId());
            dto.setOpenedByUserId(dispute.getOpenedBy().getId());
            dto.setAgainstSellerId(dispute.getAgainstSeller().getId());
            dto.setStatus(dispute.getStatus());
            dto.setReason(dispute.getReason());
            dto.setDescription(dispute.getDescription());
            dto.setResolutionComment(dispute.getResolutionComment());
            dto.setCreatedAt(dispute.getCreatedAt());
            dto.setUpdatedAt(dispute.getUpdatedAt());
            return dto;
        }
    }

    @Data
    public static class MessageResponse {
        @NotNull
        private UUID id;
        @NotNull
        private UUID disputeId;
        @NotNull
        private UUID senderId;
        private String senderFullName;
        @NotBlank
        private String content;
        private OffsetDateTime createdAt;

        public static MessageResponse from(Message message) {
            MessageResponse dto = new MessageResponse();
            dto.setId(message.getId());
            dto.setDisputeId(message.getDispute().getId());
            dto.setSenderId(message.getSender().getId());
            dto.setSenderFullName(message.getSender().getFullName());
            dto.setContent(message.getContent());
            dto.setCreatedAt(message.getCreatedAt());
            return dto;
        }
    }
}
