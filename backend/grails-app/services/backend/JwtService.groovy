package backend

import grails.gorm.transactions.ReadOnly
import io.jsonwebtoken.Claims
import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys

import javax.crypto.SecretKey
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.time.temporal.ChronoUnit

@ReadOnly
class JwtService {

    // Dev-only secret — override via env for prod deployments.
    private static final String DEV_SECRET =
            'hook-cook-dev-secret-change-me-please-change-me-please-change-me'

    private static final long TOKEN_TTL_HOURS = 12

    private SecretKey signingKey() {
        String secret = System.getenv('HC_JWT_SECRET') ?: DEV_SECRET
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8)
        Keys.hmacShaKeyFor(keyBytes)
    }

    String issue(User user) {
        Instant now = Instant.now()
        Instant expiry = now.plus(TOKEN_TTL_HOURS, ChronoUnit.HOURS)

        Jwts.builder()
                .subject(user.id as String)
                .claim('email', user.email)
                .claim('role', user.role)
                .claim('firstName', user.firstName)
                .claim('lastName', user.lastName)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(signingKey())
                .compact()
    }

    Claims parse(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey())
                    .build()
                    .parseSignedClaims(token)
                    .payload
        } catch (JwtException ignored) {
            return null
        }
    }
}
