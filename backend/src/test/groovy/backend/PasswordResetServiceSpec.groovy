package backend

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import spock.lang.Specification

import java.time.Instant
import java.time.temporal.ChronoUnit

class PasswordResetServiceSpec extends Specification
        implements ServiceUnitTest<PasswordResetService>, DataTest {

    void setupSpec() {
        mockDomains User, PasswordResetToken
    }

    def setup() {
        service.mailService = Mock(MailService)
        // Rate limit permissif par defaut (on teste le rate-limit dans
        // RateLimitServiceSpec, ici on veut que les requetes passent).
        service.rateLimitService = new RateLimitService()
    }

    User buildUser(String email = 'alice@test.fr') {
        new User(
                email: email, passwordHash: '$2a$12$originalHash',
                firstName: 'Alice', lastName: 'Martin',
        ).save(failOnError: true, validate: false)
    }

    // ────────── requestReset ─────────────────────────────────────

    void "requestReset renvoie ok même pour un email inconnu (anti-énumération)"() {
        when:
        Map r = service.requestReset('inconnu@nulle-part.fr', 'http://localhost:5173')

        then:
        r.ok == true
        // Pas d'email envoyé puisque le compte n'existe pas
        0 * service.mailService.send(_, _, _)
    }

    void "requestReset crée un token et envoie un mail si l'email existe"() {
        given:
        User u = buildUser()

        when:
        Map r = service.requestReset('alice@test.fr', 'http://localhost:5173')

        then:
        r.ok == true
        PasswordResetToken.countByUser(u) == 1
        PasswordResetToken tok = PasswordResetToken.findByUser(u)
        tok.used == false
        tok.expiresAt.after(new Date())
        tok.token.length() >= 32 // UUID full length

        and: 'un email a été envoyé contenant le lien vers la page de reset'
        1 * service.mailService.send(
                'alice@test.fr',
                { String subject -> subject?.contains('mot de passe') || subject?.contains('Réinitialisation') },
                { String body -> body?.contains('http://localhost:5173/reset-password/') }
        )
    }

    void "requestReset normalise l'email (trim + lowercase)"() {
        given:
        buildUser('alice@test.fr')

        when:
        Map r = service.requestReset('  ALICE@TEST.FR  ', 'http://localhost:5173')

        then:
        r.ok == true
        1 * service.mailService.send('alice@test.fr', _, _)
    }

    void "requestReset invalide les tokens précédents du user"() {
        given:
        User u = buildUser()
        PasswordResetToken old = new PasswordResetToken(
                user: u, token: 'old-token-xxxxxxxxxxxxxxxxxxxxxxxxxx',
                expiresAt: Date.from(Instant.now().plus(1, ChronoUnit.HOURS)),
                used: false,
        )
        old.save(failOnError: true)

        when:
        service.requestReset('alice@test.fr', 'http://localhost:5173')

        then:
        PasswordResetToken refreshed = PasswordResetToken.findByToken('old-token-xxxxxxxxxxxxxxxxxxxxxxxxxx')
        refreshed.used == true
        refreshed.usedAt != null
    }

    void "requestReset respecte le rate limit (3/h par email)"() {
        given:
        buildUser('alice@test.fr')

        when: 'on enchaine 5 demandes'
        (1..5).each { service.requestReset('alice@test.fr', 'http://localhost:5173') }

        then: 'seuls 3 emails sont envoyes (limite respectee)'
        3 * service.mailService.send(_, _, _)
    }

    // ────────── confirmReset ─────────────────────────────────────

    void "confirmReset refuse les tokens manquants ou vides"() {
        expect:
        service.confirmReset(null, 'password12345').error == 'Token manquant.'
        service.confirmReset('', 'password12345').error == 'Token manquant.'
    }

    void "confirmReset refuse les mots de passe trop courts"() {
        expect:
        service.confirmReset('some-token', 'short').error == 'Le mot de passe doit faire au moins 8 caractères.'
        service.confirmReset('some-token', '').error == 'Le mot de passe doit faire au moins 8 caractères.'
    }

    void "confirmReset refuse un token inexistant"() {
        expect:
        service.confirmReset('token-qui-n-existe-pas', 'password12345').error == 'Token invalide.'
    }

    void "confirmReset refuse un token expiré"() {
        given:
        User u = buildUser()
        new PasswordResetToken(
                user: u, token: 'expired-token-xxxxxxxxxxxxxxxxxxxxxxx',
                expiresAt: Date.from(Instant.now().minus(1, ChronoUnit.MINUTES)),
                used: false,
        ).save(failOnError: true)

        expect:
        service.confirmReset('expired-token-xxxxxxxxxxxxxxxxxxxxxxx', 'newpass1234').error ==
                'Token expiré ou déjà utilisé.'
    }

    void "confirmReset refuse un token déjà utilisé (one-shot)"() {
        given:
        User u = buildUser()
        new PasswordResetToken(
                user: u, token: 'used-token-xxxxxxxxxxxxxxxxxxxxxxxxxxx',
                expiresAt: Date.from(Instant.now().plus(1, ChronoUnit.HOURS)),
                used: true, usedAt: new Date(),
        ).save(failOnError: true)

        expect:
        service.confirmReset('used-token-xxxxxxxxxxxxxxxxxxxxxxxxxxx', 'newpass1234').error ==
                'Token expiré ou déjà utilisé.'
    }

    void "confirmReset valide met à jour le hash et marque le token used"() {
        given:
        User u = buildUser()
        String originalHash = u.passwordHash
        new PasswordResetToken(
                user: u, token: 'valid-token-xxxxxxxxxxxxxxxxxxxxxxxxxx',
                expiresAt: Date.from(Instant.now().plus(1, ChronoUnit.HOURS)),
                used: false,
        ).save(failOnError: true)

        when:
        Map r = service.confirmReset('valid-token-xxxxxxxxxxxxxxxxxxxxxxxxxx', 'nouveaumotdepasse')

        then:
        r.ok == true
        r.email == 'alice@test.fr'

        and: 'le hash du user a change'
        User refreshed = User.get(u.id)
        refreshed.passwordHash != originalHash
        refreshed.passwordHash.startsWith('$2a$12$') // nouveau BCrypt
        new BCryptPasswordEncoder().matches('nouveaumotdepasse', refreshed.passwordHash)

        and: 'le token est marque comme utilise'
        PasswordResetToken used = PasswordResetToken.findByToken('valid-token-xxxxxxxxxxxxxxxxxxxxxxxxxx')
        used.used == true
        used.usedAt != null
    }

    void "confirmReset ne peut pas être rejoué avec le même token"() {
        given:
        User u = buildUser()
        new PasswordResetToken(
                user: u, token: 'oneshot-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                expiresAt: Date.from(Instant.now().plus(1, ChronoUnit.HOURS)),
                used: false,
        ).save(failOnError: true)

        when: 'premiere utilisation'
        Map r1 = service.confirmReset('oneshot-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'first-password-1234')

        then:
        r1.ok == true

        when: 'seconde tentative avec le meme token'
        Map r2 = service.confirmReset('oneshot-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'second-password-9999')

        then:
        r2.error == 'Token expiré ou déjà utilisé.'
    }
}
