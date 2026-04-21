package backend

import grails.util.Environment
import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys

import javax.crypto.SecretKey
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.time.temporal.ChronoUnit

class JwtService {

    // Secret dev uniquement — 64 caractères pour satisfaire la taille
    // HMAC-SHA512 minimale attendue. NE DOIT JAMAIS être utilisé en prod :
    // signingKey() refuse de démarrer si HC_JWT_SECRET n'est pas fourni
    // et suffisamment long en environnement PRODUCTION.
    private static final String DEV_SECRET =
            'hook-cook-dev-secret-change-me-please-change-me-please-change-me'

    private static final int MIN_SECRET_LENGTH = 64
    private static final long TOKEN_TTL_HOURS = 12

    private SecretKey signingKey() {
        String secret = System.getenv('HC_JWT_SECRET')
        boolean isProd = Environment.current == Environment.PRODUCTION

        if (isProd) {
            if (!secret || secret.length() < MIN_SECRET_LENGTH) {
                throw new IllegalStateException(
                        "HC_JWT_SECRET manquant ou < ${MIN_SECRET_LENGTH} caractères. " +
                        "Refus de démarrer en environnement PRODUCTION avec un secret faible. " +
                        "Génère-en un fort avec :\n" +
                        "  python -c \"import secrets; print(secrets.token_urlsafe(64))\"")
            }
        } else if (!secret || secret.length() < MIN_SECRET_LENGTH) {
            secret = DEV_SECRET
            log.warn('JWT : utilisation du DEV_SECRET (environnement {}). Ne jamais déployer en prod sans HC_JWT_SECRET.', Environment.current)
        }

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
        } catch (Throwable t) {
            log.warn('JWT parse error: {} — {}', t.class.simpleName, t.message)
            return null
        }
    }
}
