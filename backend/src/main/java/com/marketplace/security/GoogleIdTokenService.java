package com.marketplace.security;

import com.marketplace.application.exceptions.BusinessException;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Проверка Google ID token через tokeninfo endpoint.
 * Для курса/демо достаточно; в проде лучше проверять подпись через публичные ключи Google.
 */
@Service
public class GoogleIdTokenService {

    private final RestClient restClient;
    private final String expectedAudience;

    public GoogleIdTokenService(
            RestClient.Builder builder,
            @Value("${google.oauth.client-id:}") String expectedAudience
    ) {
        this.restClient = builder.baseUrl("https://oauth2.googleapis.com").build();
        this.expectedAudience = expectedAudience;
    }

    public GoogleTokenInfo verify(String idToken) {
        if (expectedAudience == null || expectedAudience.isBlank()) {
            throw new BusinessException("Google OAuth client id is not configured (google.oauth.client-id)");
        }
        if (idToken == null || idToken.isBlank()) {
            throw new BusinessException("idToken is required");
        }

        GoogleTokenInfo info = restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/tokeninfo").queryParam("id_token", idToken).build())
                .retrieve()
                .body(GoogleTokenInfo.class);

        if (info == null) {
            throw new BusinessException("Invalid Google token");
        }

        if (info.getAud() == null || !expectedAudience.equals(info.getAud())) {
            throw new BusinessException("Google token has invalid audience");
        }
        if (info.getEmail() == null || info.getEmail().isBlank()) {
            throw new BusinessException("Google token does not contain email");
        }
        if (info.getEmailVerified() != null && !"true".equalsIgnoreCase(info.getEmailVerified())) {
            throw new BusinessException("Google email is not verified");
        }
        return info;
    }

    @Data
    public static class GoogleTokenInfo {
        private String aud;
        private String sub;
        private String email;
        /** tokeninfo возвращает строку "true"/"false" */
        private String email_verified;
        private String name;
        private String given_name;
        private String family_name;
        private String picture;

        public String getEmailVerified() {
            return email_verified;
        }
    }
}

