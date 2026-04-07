package com.marketplace.security;

import com.marketplace.domain.entities.User;

/**
 * Роль из БД (колонка users.role) с резервом для старых данных.
 */
public final class UserRoleResolver {

    public static final String ADMIN_EMAIL = "admin@marketplace.local";
    public static final String MODERATOR_EMAIL = "moderator@marketplace.local";

    private UserRoleResolver() {
    }

    /** Роль при регистрации (демо: фиксированные ящики админа/модератора). */
    public static String initialRoleForNewUser(String email) {
        if (email == null) {
            return "BUYER";
        }
        String e = email.trim();
        if (ADMIN_EMAIL.equalsIgnoreCase(e)) {
            return "ADMIN";
        }
        if (MODERATOR_EMAIL.equalsIgnoreCase(e)) {
            return "MODERATOR";
        }
        return "BUYER";
    }

    public static String roleFor(User user) {
        if (user.getRole() != null && !user.getRole().isBlank()) {
            return user.getRole().trim().toUpperCase();
        }
        if (user.getEmail() != null && ADMIN_EMAIL.equalsIgnoreCase(user.getEmail().trim())) {
            return "ADMIN";
        }
        if (user.getStoreName() != null && !user.getStoreName().isBlank()) {
            return "SELLER";
        }
        return "BUYER";
    }
}
