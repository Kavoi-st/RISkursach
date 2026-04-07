package com.marketplace.presentation.controllers;

import com.marketplace.application.services.UserService;
import com.marketplace.domain.entities.User;
import com.marketplace.infrastructure.repositories.UserRepository;
import com.marketplace.security.AuthenticationService;
import com.marketplace.security.GoogleIdTokenService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
@Validated
public class ProfileController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final AuthenticationService authenticationService;
    private final GoogleIdTokenService googleIdTokenService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal UserDetails principal) {
        User u = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        MeResponse dto = new MeResponse();
        dto.setId(u.getId());
        dto.setEmail(u.getEmail());
        dto.setFullName(u.getFullName());
        dto.setRole(u.getRole());
        dto.setStoreName(u.getStoreName());
        dto.setStoreDescription(u.getStoreDescription());
        dto.setGoogleLinked(u.getGoogleSub() != null && !u.getGoogleSub().isBlank());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/link-google")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MeResponse> linkGoogle(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody LinkGoogleRequest request
    ) {
        User u = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        GoogleIdTokenService.GoogleTokenInfo info = googleIdTokenService.verify(request.getIdToken());

        // безопасность: привязываем только Google к тому же email, что и у пользователя
        if (!u.getEmail().equalsIgnoreCase(info.getEmail())) {
            throw new IllegalArgumentException("Google email must match account email");
        }

        u.setGoogleSub(info.getSub());
        u.setGoogleEmail(info.getEmail());
        u.setGoogleLinkedAt(OffsetDateTime.now());
        u.setUpdatedAt(OffsetDateTime.now());
        userRepository.save(u);

        MeResponse dto = new MeResponse();
        dto.setId(u.getId());
        dto.setEmail(u.getEmail());
        dto.setFullName(u.getFullName());
        dto.setRole(u.getRole());
        dto.setStoreName(u.getStoreName());
        dto.setStoreDescription(u.getStoreDescription());
        dto.setGoogleLinked(true);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/unlink-google")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MeResponse> unlinkGoogle(@AuthenticationPrincipal UserDetails principal) {
        User u = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        u.setGoogleSub(null);
        u.setGoogleEmail(null);
        u.setGoogleLinkedAt(null);
        u.setUpdatedAt(OffsetDateTime.now());
        userRepository.save(u);

        MeResponse dto = new MeResponse();
        dto.setId(u.getId());
        dto.setEmail(u.getEmail());
        dto.setFullName(u.getFullName());
        dto.setRole(u.getRole());
        dto.setStoreName(u.getStoreName());
        dto.setStoreDescription(u.getStoreDescription());
        dto.setGoogleLinked(false);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/become-seller")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AuthTokensResponse> becomeSeller(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody BecomeSellerRequest request
    ) {
        User u = userService.becomeSeller(principal.getUsername(), request.getStoreName(), request.getStoreDescription());
        AuthenticationService.AuthResult tokens = authenticationService.issueTokensForUser(u);
        AuthTokensResponse resp = new AuthTokensResponse();
        resp.setAccessToken(tokens.accessToken());
        resp.setRefreshToken(tokens.refreshToken());
        resp.setTokenType("Bearer");
        resp.setUserId(u.getId());
        resp.setEmail(u.getEmail());
        resp.setFullName(u.getFullName());
        resp.setRole(tokens.role());
        resp.setStoreName(u.getStoreName());
        return ResponseEntity.ok(resp);
    }

    @Data
    public static class BecomeSellerRequest {
        @NotBlank
        private String storeName;
        private String storeDescription;
    }

    @Data
    public static class MeResponse {
        private UUID id;
        private String email;
        private String fullName;
        private String role;
        private String storeName;
        private String storeDescription;
        private boolean googleLinked;
    }

    @Data
    public static class LinkGoogleRequest {
        @NotBlank
        private String idToken;
    }

    @Data
    public static class AuthTokensResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType;
        private UUID userId;
        private String email;
        private String fullName;
        private String role;
        private String storeName;
    }
}
