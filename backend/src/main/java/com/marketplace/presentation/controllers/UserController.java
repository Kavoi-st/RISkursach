package com.marketplace.presentation.controllers;

import com.marketplace.application.services.UserService;
import com.marketplace.domain.entities.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Validated
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable("id") @NotBlank String id) {
        User user = userService.getActiveUserById(UUID.fromString(id));
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setPhone(user.getPhone());
        response.setActive(user.isActive());
        response.setStoreName(user.getStoreName());
        response.setStoreDescription(user.getStoreDescription());
        response.setRole(user.getRole());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateUser(@PathVariable("id") @NotBlank String id) {
        userService.deactivateUser(UUID.fromString(id));
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class UserResponse {
        @NotNull
        private UUID id;
        @NotBlank
        private String email;
        @NotBlank
        private String fullName;
        private String phone;
        private boolean active;
        private String storeName;
        private String storeDescription;
        private String role;
    }
}

