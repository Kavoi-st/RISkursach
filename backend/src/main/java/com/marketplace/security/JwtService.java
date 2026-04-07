package com.marketplace.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private final Key accessTokenKey;
    private final Key refreshTokenKey;
    private final long accessTokenTtlMillis;
    private final long refreshTokenTtlMillis;

    public JwtService(
            @Value("${security.jwt.access-secret}") String accessSecret,
            @Value("${security.jwt.refresh-secret}") String refreshSecret,
            @Value("${security.jwt.access-ttl-ms}") long accessTokenTtlMillis,
            @Value("${security.jwt.refresh-ttl-ms}") long refreshTokenTtlMillis
    ) {
        this.accessTokenKey = Keys.hmacShaKeyFor(accessSecret.getBytes());
        this.refreshTokenKey = Keys.hmacShaKeyFor(refreshSecret.getBytes());
        this.accessTokenTtlMillis = accessTokenTtlMillis;
        this.refreshTokenTtlMillis = refreshTokenTtlMillis;
    }

    public String generateAccessToken(String subject, Map<String, Object> claims) {
        return buildToken(subject, claims, accessTokenKey, accessTokenTtlMillis);
    }

    public String generateRefreshToken(String subject) {
        return buildToken(subject, Map.of(), refreshTokenKey, refreshTokenTtlMillis);
    }

    private String buildToken(String subject,
                              Map<String, Object> claims,
                              Key key,
                              long ttlMillis) {
        Instant now = Instant.now();
        Instant exp = now.plusMillis(ttlMillis);
        return Jwts.builder()
                .setSubject(subject)
                .addClaims(claims)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Jws<Claims> parseAccessToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(accessTokenKey)
                .build()
                .parseClaimsJws(token);
    }

    public String getSubjectFromAccessToken(String token) {
        return parseAccessToken(token).getBody().getSubject();
    }
}

