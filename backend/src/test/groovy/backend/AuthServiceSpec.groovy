package backend

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import spock.lang.Specification

class AuthServiceSpec extends Specification implements ServiceUnitTest<AuthService>, DataTest {

    void setupSpec() {
        mockDomains User
    }

    def setup() {
        service.jwtService = new JwtService()
    }

    void "register rejects incomplete input"() {
        when:
        Map result = service.register([email: 'x@y.fr'])

        then:
        result.error == 'Tous les champs sont requis.'
    }

    void "register rejects invalid email"() {
        when:
        Map result = service.register([
                email    : 'pas-un-email',
                password : 'password1234',
                firstName: 'Jean',
                lastName : 'Test',
        ])

        then:
        result.error == 'Email invalide.'
    }

    void "register rejects short password"() {
        when:
        Map result = service.register([
                email    : 'jean@test.fr',
                password : 'short',
                firstName: 'Jean',
                lastName : 'Test',
        ])

        then:
        result.error == 'Le mot de passe doit faire au moins 8 caractères.'
    }

    void "register creates the user, hashes password and returns a token"() {
        when:
        Map result = service.register([
                email    : 'Jean@TEST.fr',
                password : 'password1234',
                firstName: 'Jean',
                lastName : 'Test',
        ])

        then:
        !result.error
        result.user.email == 'jean@test.fr'
        result.user.role == 'ROLE_USER'
        result.user.passwordHash != 'password1234'
        result.user.passwordHash?.startsWith('$2')
        result.token?.split('\\.')?.length == 3
    }

    void "register rejects duplicate email"() {
        given:
        new User(
                email: 'claude@pêche.fr',
                passwordHash: 'irrelevant',
                firstName: 'Claude',
                lastName: 'Desprez',
        ).save(failOnError: true, validate: false)

        when:
        Map result = service.register([
                email    : 'claude@pêche.fr',
                password : 'password1234',
                firstName: 'Claude',
                lastName : 'Autre',
        ])

        then:
        result.error == 'Un compte existe déjà avec cet email.'
    }

    void "login returns a token when credentials match"() {
        given:
        Map regResult = service.register([
                email    : 'pecheur@test.fr',
                password : 'password1234',
                firstName: 'Pecheur',
                lastName : 'Test',
        ])
        assert regResult.user

        when:
        Map loginResult = service.login([
                email   : 'pecheur@test.fr',
                password: 'password1234',
        ])

        then:
        !loginResult.error
        loginResult.token?.split('\\.')?.length == 3
        loginResult.user.email == 'pecheur@test.fr'
    }

    void "login rejects wrong password"() {
        given:
        service.register([
                email    : 'pecheur@test.fr',
                password : 'password1234',
                firstName: 'Pecheur',
                lastName : 'Test',
        ])

        when:
        Map result = service.login([
                email   : 'pecheur@test.fr',
                password: 'wrongpassword',
        ])

        then:
        result.error == 'Email ou mot de passe incorrect.'
    }
}
