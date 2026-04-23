package backend

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import groovy.json.JsonOutput
import spock.lang.Specification

class PermitServiceSpec extends Specification implements ServiceUnitTest<PermitService>, DataTest {

    void setupSpec() {
        mockDomains User, Permit, PermitType, Department
    }

    def setup() {
        PermitType t = new PermitType(
                title: 'Permis annuel',
                label: 'Le plus choisi',
                price: 92.00,
                itemsJson: JsonOutput.toJson(['a', 'b', 'c']),
        )
        t.id = 'annuel'
        t.save(failOnError: true)

        Department d = new Department(name: '66 — Pyrénées-Orientales')
        d.id = '66'
        d.save(failOnError: true)

        // Par défaut Stripe désactivé → permis créé directement en pending.
        // Tests Stripe-on overridenront isConfigured().
        service.stripeService = Mock(StripeService) { isConfigured() >> false }
    }

    User buildUser() {
        new User(
                email: 'x@test.fr', passwordHash: 'h',
                firstName: 'X', lastName: 'Y',
        ).save(failOnError: true, validate: false)
    }

    void "create requires an authenticated user"() {
        when:
        Map r = service.create(null, [:])

        then:
        r.error == 'Authentification requise.'
    }

    void "create rejects unknown permit type"() {
        given:
        User u = buildUser()

        when:
        Map r = service.create(u, [typeId: 'inexistant'])

        then:
        r.error == 'Type de permis invalide.'
    }

    void "create rejects unknown department"() {
        given:
        User u = buildUser()

        when:
        Map r = service.create(u, [typeId: 'annuel', department: 'XX — inconnu', firstName: 'A', lastName: 'B', birthDate: '1990-01-01'])

        then:
        r.error == 'Département invalide.'
    }

    void "create accepts a valid department by code or name"() {
        given:
        User u = buildUser()

        when:
        Map byCode = service.create(u, [
                typeId: 'annuel', department: '66', firstName: 'A', lastName: 'B', birthDate: '1990-01-01',
        ])
        Map byName = service.create(u, [
                typeId: 'annuel', department: '66 — Pyrénées-Orientales', firstName: 'A', lastName: 'B', birthDate: '1990-01-02',
        ])

        then:
        !byCode.error
        byCode.permit.department == '66 — Pyrénées-Orientales'
        !byName.error
        byName.permit.department == '66 — Pyrénées-Orientales'
    }

    void "create persists doc URLs and sets pending status with initial history"() {
        given:
        User u = buildUser()

        when:
        Map r = service.create(u, [
                typeId     : 'annuel',
                firstName  : 'Alice',
                lastName   : 'Martin',
                birthDate  : '1990-05-12',
                idDocUrl   : 'http://x/a.jpg',
                photoDocUrl: 'http://x/b.jpg',
        ])

        then:
        !r.error
        r.permit.status == 'pending'
        r.permit.statusLabel == 'En instruction'
        r.permit.idDocUrl == 'http://x/a.jpg'
        r.permit.photoDocUrl == 'http://x/b.jpg'
        r.permit.amount == 92.00
        r.permit.history?.size() == 4
        r.permit.history[0].label == 'Demande envoyée'
    }

    void "updateStatus transitions to approved with correct history and label"() {
        given:
        User u = buildUser()
        Map c = service.create(u, [typeId: 'annuel', firstName: 'A', lastName: 'B', birthDate: '1990-01-01'])
        String ref = c.permit.reference

        when:
        Map r = service.updateStatus(ref, 'approved')

        then:
        !r.error
        r.permit.status == 'approved'
        r.permit.statusLabel == 'Approuvé'
        r.permit.history.last().label == 'Approuvé par la fédération'
    }

    void "updateStatus rejects invalid status"() {
        given:
        User u = buildUser()
        Map c = service.create(u, [typeId: 'annuel', firstName: 'A', lastName: 'B', birthDate: '1990-01-01'])

        when:
        Map r = service.updateStatus(c.permit.reference, 'whatever')

        then:
        r.error == 'Statut invalide.'
    }

    void "references are unique and match the FR-2026 pattern"() {
        given:
        User u = buildUser()
        Set<String> refs = []

        when:
        10.times {
            Map r = service.create(u, [typeId: 'annuel', firstName: 'A', lastName: 'B', birthDate: '1990-01-01'])
            refs << r.permit.reference
        }

        then:
        refs.size() == 10
        refs.every { it ==~ /^FR-2026-[0-9A-F]{10}$/ }
    }

    void "create en mode Stripe crée le permis pending_payment + retourne clientSecret"() {
        given:
        User u = buildUser()
        service.stripeService = Mock(StripeService) {
            isConfigured() >> true
            getPublishableKey() >> 'pk_test_xxx'
            createPaymentIntent(_, _) >> [
                    paymentIntentId: 'pi_permit_123',
                    clientSecret   : 'pi_permit_123_secret_abc',
            ]
        }

        when:
        Map r = service.create(u, [
                typeId: 'annuel', firstName: 'A', lastName: 'B', birthDate: '1990-01-01',
        ])

        then:
        !r.error
        r.permit.status == 'pending_payment'
        r.permit.statusLabel == 'En attente de paiement'
        r.permit.stripePaymentIntentId == 'pi_permit_123'
        r.clientSecret == 'pi_permit_123_secret_abc'
        r.publishableKey == 'pk_test_xxx'
    }

    void "markPaidByPaymentIntent bascule pending_payment → pending (En instruction)"() {
        given:
        User u = buildUser()
        service.stripeService = Mock(StripeService) {
            isConfigured() >> true
            createPaymentIntent(_, _) >> [paymentIntentId: 'pi_pay_ok', clientSecret: 'cs']
        }
        service.create(u, [typeId: 'annuel', firstName: 'A', lastName: 'B', birthDate: '1990-01-01'])

        when:
        Map r = service.markPaidByPaymentIntent('pi_pay_ok')

        then:
        !r.error
        r.permit.status == 'pending'
        r.permit.statusLabel == 'En instruction'
    }

    void "markPaidByPaymentIntent est idempotent"() {
        given:
        User u = buildUser()
        service.stripeService = Mock(StripeService) {
            isConfigured() >> true
            createPaymentIntent(_, _) >> [paymentIntentId: 'pi_idem', clientSecret: 'cs']
        }
        service.create(u, [typeId: 'annuel', firstName: 'A', lastName: 'B', birthDate: '1990-01-01'])

        when:
        Map r1 = service.markPaidByPaymentIntent('pi_idem')
        Map r2 = service.markPaidByPaymentIntent('pi_idem')

        then:
        !r1.error
        r2.alreadyProcessed == true
    }
}
