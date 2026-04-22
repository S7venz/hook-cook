package backend

import grails.testing.services.ServiceUnitTest
import spock.lang.Specification

class StripeServiceSpec extends Specification implements ServiceUnitTest<StripeService> {

    void "isConfigured renvoie false sans clé secrète"() {
        given:
        service.secretKey = null

        expect:
        !service.isConfigured()
    }

    void "isConfigured renvoie false sur une chaîne vide ou blanche"() {
        given:
        service.secretKey = '   '

        expect:
        !service.isConfigured()
    }

    void "isConfigured renvoie true quand une clé est définie"() {
        given:
        service.secretKey = 'sk_test_xxxxxxxxxxxxxxxxxxxx'

        expect:
        service.isConfigured()
    }

    void "createPaymentIntent throw quand Stripe n'est pas configuré"() {
        given:
        service.secretKey = null

        when:
        service.createPaymentIntent(100.0G, [orderRef: 'HC-1'])

        then:
        IllegalStateException e = thrown()
        e.message == 'Stripe non configuré.'
    }

    void "verifyWebhook throw quand le webhook secret est absent"() {
        given:
        service.webhookSecret = null

        when:
        service.verifyWebhook('{}', 'sig')

        then:
        IllegalStateException e = thrown()
        e.message?.contains('STRIPE_WEBHOOK_SECRET')
    }
}
