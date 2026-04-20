package backend

import io.jsonwebtoken.Claims
import spock.lang.Specification

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
}
