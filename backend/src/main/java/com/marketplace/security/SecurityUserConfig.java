package com.marketplace.security;

import com.marketplace.domain.entities.User;
import com.marketplace.infrastructure.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

/**
 * Отдельно от {@link SecurityConfig}, чтобы не было цикла:
 * SecurityConfig → JwtAuthenticationFilter → UserDetailsService → SecurityConfig.
 */
@Configuration
@RequiredArgsConstructor
public class SecurityUserConfig {

    private final UserRepository userRepository;

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

            String role = UserRoleResolver.roleFor(user);

            return org.springframework.security.core.userdetails.User.withUsername(user.getEmail())
                    .password(user.getPasswordHash())
                    .roles(role)
                    .disabled(!user.isActive())
                    .build();
        };
    }
}
