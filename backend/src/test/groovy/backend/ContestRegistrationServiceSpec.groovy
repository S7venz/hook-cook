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
        // Par défaut Stripe désactivé : inscription gratuite/mock direct.
        service.stripeService = Mock(StripeService) { isConfigured() >> false }
    }

    User buildUser(String email = 'u@test.fr') {
        new User(email: email, passwordHash: 'h', firstName: 'U', lastName: 'T')
                .save(failOnError: true, validate: false)
    }

    Contest buildContest(int inscrits = 0, int max = 40, BigDecimal price = BigDecimal.ZERO) {
        Contest c = new Contest(
                title: 'Open Têt', date: '2026-05-04', dateDisplay: '04 MAI',
                lieu: 'Olette', inscrits: inscrits, max: max, price: price,
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

    void "register incrémente inscrits sur le concours et envoie un mail (gratuit)"() {
        given:
        Contest c = buildContest(5, 40)
        User u = buildUser()

        when:
        Map r = service.register(u, c.id, [category: 'hommes-am'])

        then:
        !r.error
        r.registration.category == 'hommes-am'
        r.registration.status == 'paid'
        1 * service.mailService.contestRegistration(_)
        Contest.get(c.id).inscrits == 6
    }

    void "register payant en mode Stripe crée pending_payment + retourne clientSecret"() {
        given:
        Contest c = buildContest(5, 40, 25.00G)
        User u = buildUser()
        service.stripeService = Mock(StripeService) {
            isConfigured() >> true
            getPublishableKey() >> 'pk_test_xxx'
            createPaymentIntent(_, _) >> [
                    paymentIntentId: 'pi_contest_123',
                    clientSecret   : 'pi_contest_123_secret',
            ]
        }

        when:
        Map r = service.register(u, c.id, [category: 'hommes-am'])

        then:
        !r.error
        r.registration.status == 'pending_payment'
        r.registration.stripePaymentIntentId == 'pi_contest_123'
        r.clientSecret == 'pi_contest_123_secret'
        // Inscrits PAS incrémentés tant que le paiement n'est pas confirmé
        Contest.get(c.id).inscrits == 5
        // Mail PAS envoyé non plus
        0 * service.mailService.contestRegistration(_)
    }

    void "markPaidByPaymentIntent incrémente inscrits + envoie le mail"() {
        given:
        Contest c = buildContest(5, 40, 25.00G)
        User u = buildUser()
        service.stripeService = Mock(StripeService) {
            isConfigured() >> true
            createPaymentIntent(_, _) >> [paymentIntentId: 'pi_pay_ok', clientSecret: 'cs']
        }
        service.register(u, c.id, [category: 'hommes-am'])

        when:
        Map r = service.markPaidByPaymentIntent('pi_pay_ok')

        then:
        !r.error
        r.registration.status == 'paid'
        Contest.get(c.id).inscrits == 6
        1 * service.mailService.contestRegistration(_)
    }

    void "markPaidByPaymentIntent est idempotent — n'incrémente pas 2 fois"() {
        given:
        Contest c = buildContest(5, 40, 25.00G)
        User u = buildUser()
        service.stripeService = Mock(StripeService) {
            isConfigured() >> true
            createPaymentIntent(_, _) >> [paymentIntentId: 'pi_idem', clientSecret: 'cs']
        }
        service.register(u, c.id, [category: 'femmes'])

        when:
        Map r1 = service.markPaidByPaymentIntent('pi_idem')
        Map r2 = service.markPaidByPaymentIntent('pi_idem')

        then:
        !r1.error
        r2.alreadyProcessed == true
        Contest.get(c.id).inscrits == 6 // une seule incrémentation
    }
}
