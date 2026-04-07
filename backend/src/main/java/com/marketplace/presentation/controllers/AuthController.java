package com.marketplace.presentation.controllers;

import com.marketplace.domain.entities.User;
import com.marketplace.security.AuthenticationService;
import com.marketplace.security.GoogleIdTokenService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.marketplace.infrastructure.repositories.UserRepository;
import com.marketplace.security.UserRoleResolver;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final AuthenticationService authenticationService;
    private final GoogleIdTokenService googleIdTokenService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        authenticationService.register(
                request.getEmail(),
                request.getPassword(),
                request.getFullName()
        );

        AuthenticationService.AuthResult result =
                authenticationService.authenticateAndIssueTokens(request.getEmail(), request.getPassword());

        return ResponseEntity.ok(toAuthResponse(result));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthenticationService.AuthResult result =
                authenticationService.authenticateAndIssueTokens(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(toAuthResponse(result));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> google(@RequestBody GoogleLoginRequest request) {
        GoogleIdTokenService.GoogleTokenInfo info = googleIdTokenService.verify(request.getIdToken());
        User user = userRepository.findByEmail(info.getEmail())
                .orElseGet(() -> {
                    OffsetDateTime now = OffsetDateTime.now();
                    String fullName = (info.getName() != null && !info.getName().isBlank())
                            ? info.getName()
                            : info.getEmail();
                    return userRepository.save(User.builder()
                            .id(UUID.randomUUID())
                            .email(info.getEmail())
                            .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .fullName(fullName)
                            .active(true)
                            .role(UserRoleResolver.initialRoleForNewUser(info.getEmail()))
                            .googleSub(info.getSub())
                            .googleEmail(info.getEmail())
                            .googleLinkedAt(now)
                            .createdAt(now)
                            .updatedAt(now)
                            .build());
                });

        // Обновляем привязку Google для уже существующего пользователя.
        user.setGoogleSub(info.getSub());
        user.setGoogleEmail(info.getEmail());
        user.setGoogleLinkedAt(OffsetDateTime.now());
        user.setUpdatedAt(OffsetDateTime.now());
        userRepository.save(user);

        AuthenticationService.AuthResult result = authenticationService.issueTokensForUser(user);
        return ResponseEntity.ok(toAuthResponse(result));
    }

    private static AuthResponse toAuthResponse(AuthenticationService.AuthResult result) {
        User user = result.user();
        AuthResponse response = new AuthResponse();
        response.setAccessToken(result.accessToken());
        response.setRefreshToken(result.refreshToken());
        response.setTokenType("Bearer");
        response.setUserId(user.getId());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setRole(result.role());
        return response;
    }

    @Data
    public static class RegisterRequest {
        @Email
        @NotBlank
        private String email;

        @NotBlank
        private String password;

        @NotBlank
        private String fullName;
    }

    @Data
    public static class LoginRequest {
        @Email
        @NotBlank
        private String email;

        @NotBlank
        private String password;
    }

    @Data
    public static class GoogleLoginRequest {
        @NotBlank
        private String idToken;
    }

    @Data
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType;
        private Object userId;
        private String email;
        private String fullName;
        /** BUYER, SELLER или ADMIN */
        private String role;
    }
}

