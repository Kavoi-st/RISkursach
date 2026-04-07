package com.marketplace.application.services;

import com.marketplace.application.exceptions.BusinessException;
import com.marketplace.application.exceptions.NotFoundException;
import com.marketplace.domain.entities.User;
import com.marketplace.security.UserRoleResolver;
import com.marketplace.infrastructure.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User registerUser(String email, String rawPassword, String fullName) {
        userRepository.findByEmail(email).ifPresent(u -> {
            throw new BusinessException("User with email already exists: " + email);
        });

        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .fullName(fullName)
                .active(true)
                .role(UserRoleResolver.initialRoleForNewUser(email))
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

        return userRepository.save(user);
    }

    /**
     * Покупатель становится продавцом (название магазина обязательно).
     */
    public User becomeSeller(String email, String storeName, String storeDescription) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found: " + email));
        if (!"BUYER".equalsIgnoreCase(user.getRole())) {
            throw new BusinessException("Только покупатель может стать продавцом");
        }
        if (storeName == null || storeName.isBlank()) {
            throw new BusinessException("Укажите название магазина");
        }
        user.setStoreName(storeName.trim());
        user.setStoreDescription(storeDescription != null && !storeDescription.isBlank()
                ? storeDescription.trim()
                : null);
        user.setRole("SELLER");
        user.setUpdatedAt(OffsetDateTime.now());
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User getActiveUserById(UUID id) {
        return userRepository.findById(id)
                .filter(User::isActive)
                .orElseThrow(() -> new NotFoundException("Active user not found: " + id));
    }

    public void deactivateUser(UUID id) {
        User user = getActiveUserById(id);
        user.setActive(false);
        user.setUpdatedAt(OffsetDateTime.now());
        userRepository.save(user);
    }
}

