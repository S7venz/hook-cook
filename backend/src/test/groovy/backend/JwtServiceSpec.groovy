package backend

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import spock.lang.Specification

import javax.crypto.SecretKey
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.time.temporal.ChronoUnit

class JwtServiceSpec extends Specification {

    JwtService service

    def setup() {
        service = new JwtService()
    }

    void "issue then parse roundtrip returns the subject and role"() {
        given:
        User user = new User(
                email: 'admin@hookcook.fr',
                passwordHash: 'irrelevant',
                firstName: 'Admin',
                lastName: 'HC',
                role: 'ROLE_ADMIN',
        )
        user.id = 42L

        when:
        String token = service.issue(user)
        Claims claims = service.parse(token)

        then:
        token?.split('\\.')?.length == 3
        claims != null
        claims.getSubject() == '42'
        claims.get('email') == 'admin@hookcook.fr'
        claims.get('role') == 'ROLE_ADMIN'
        claims.get('firstName') == 'Admin'
    }

    void "parse returns null for a malformed token"() {
        expect:
        service.parse('not-a-real-token') == null
    }

    void "parse returns null for a token signed by a different key"() {
        given:
        // A token crafted with a different secret — signature verification must fail.
        String foreign = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxIn0.invalidsig'

        expect:
        service.parse(foreign) == null
    }

    void "parse returns null for an expired but correctly signed token"() {
        given: 'on reconstruit la clé de signature exactement comme le service'
        // Même logique que JwtService.signingKey() hors PRODUCTION : HC_JWT_SECRET
        // s'il est défini et assez long, sinon le secret de dev. Le token forgé est
        // donc signé avec la vraie clé — seule son expiration peut le faire rejeter,
        // pas un défaut de signature.
        String secret = System.getenv('HC_JWT_SECRET')
        if (!secret || secret.length() < 64) {
            secret = 'hook-cook-dev-secret-change-me-please-change-me-please-change-me'
        }
        SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8))

        and: 'un token dont la date d’expiration est dépassée d’une heure'
        Instant now = Instant.now()
        String expired = Jwts.builder()
                .subject('42')
                .claim('email', 'admin@hookcook.fr')
                .claim('role', 'ROLE_ADMIN')
                .issuedAt(Date.from(now.minus(13, ChronoUnit.HOURS)))
                .expiration(Date.from(now.minus(1, ChronoUnit.HOURS)))
                .signWith(key)
                .compact()

        expect: 'signature valide mais token expiré → parse renvoie null'
        service.parse(expired) == null
    }
}
