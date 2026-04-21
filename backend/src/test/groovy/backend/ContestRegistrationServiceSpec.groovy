package backend

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import spock.lang.Specification

class ContestRegistrationServiceSpec extends Specification
        implements ServiceUnitTest<ContestRegistrationService>, DataTest {

    void setupSpec() {
        mockDomains User, Contest, ContestRegistration
    }

    def setup() {
        service.mailService = Mock(MailService)
    }

    User buildUser(String email = 'u@test.fr') {
        new User(email: email, passwordHash: 'h', firstName: 'U', lastName: 'T')
                .save(failOnError: true, validate: false)
    }

    Contest buildContest(int inscrits = 0, int max = 40) {
        Contest c = new Contest(
                title: 'Open Têt', date: '2026-05-04', dateDisplay: '04 MAI',
                lieu: 'Olette', inscrits: inscrits, max: max,
        )
        c.id = 'open-tet'
        c.save(failOnError: true, validate: false)
    }

    void "register rejette un utilisateur null"() {
        given:
        buildContest()

        expect:
        service.register(null, 'open-tet', [:]).error == 'Authentification requise.'
    }

    void "register refuse un concours inconnu"() {
        given:
        User u = buildUser()

        expect:
        service.register(u, 'nope', [:]).error == 'Concours introuvable.'
    }

    void "register refuse une double inscription au même concours"() {
        given:
        User u = buildUser()
        buildContest()
        service.register(u, 'open-tet', [category: 'femmes'])

        when:
        Map r2 = service.register(u, 'open-tet', [category: 'femmes'])

        then:
        r2.error == 'Vous êtes déjà inscrit à ce concours.'
    }

    void "register incrémente inscrits sur le concours et envoie un mail"() {
        given:
        Contest c = buildContest(5, 40)
        User u = buildUser()

        when:
        Map r = service.register(u, c.id, [category: 'hommes-am'])

        then:
        !r.error
        r.registration.category == 'hommes-am'
        1 * service.mailService.contestRegistration(_)
        Contest.get(c.id).inscrits == 6
    }
}
