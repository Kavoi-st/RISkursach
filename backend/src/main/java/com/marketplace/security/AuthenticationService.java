package com.marketplace.security;

import com.marketplace.application.exceptions.NotFoundException;
import com.marketplace.domain.entities.User;
import com.marketplace.infrastructure.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public User register(String email, String rawPassword, String fullName) {
        userRepository.findByEmail(email).ifPresent(u -> {
            throw new IllegalArgumentException("User with email already exists: " + email);
        });

        OffsetDateTime now = OffsetDateTime.now();
        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .fullName(fullName)
                .active(true)
                .role(UserRoleResolver.initialRoleForNewUser(email))
                .createdAt(now)
                .updatedAt(now)
                .build();

        return userRepository.save(user);
    }

    /**
     * Аутентификация и выпуск токенов с claim userId и role (для клиента и аудита).
     */
    public AuthResult authenticateAndIssueTokens(String email, String password) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        UserDetails principal = (UserDetails) authentication.getPrincipal();

        User user = userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new NotFoundException("User not found: " + email));

        return issueTokensForUser(user);
    }

    /** Новая пара токенов после смены роли (например, стать продавцом). */
    public AuthResult issueTokensForUser(User user) {
        String role = UserRoleResolver.roleFor(user);
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId().toString());
        claims.put("role", role);

        String accessToken = jwtService.generateAccessToken(user.getEmail(), claims);
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        return new AuthResult(user, accessToken, refreshToken, role);
    }

    public record AuthResult(User user, String accessToken, String refreshToken, String role) {
    }
}

