package com.marketplace.presentation.dto;

import java.util.UUID;

public class UserDtos {

    public record UserRequest(
            String email,
            String fullName,
            String phone,
            String storeName,
            String storeDescription
    ) {
    }

    public record UserResponse(
            UUID id,
            String email,
            String fullName,
            String phone,
            boolean active,
            String storeName,
            String storeDescription
    ) {
    }
}

