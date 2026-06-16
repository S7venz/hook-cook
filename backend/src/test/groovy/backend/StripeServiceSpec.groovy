package backend

import com.stripe.model.Event
import com.stripe.model.EventDataObjectDeserializer
import com.stripe.model.PaymentIntent
import com.stripe.param.PaymentIntentCreateParams
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

    void "buildPaymentIntentParams convertit le montant en centimes et attache les métadonnées"() {
        given:
        service.currency = 'eur'

        when:
        PaymentIntentCreateParams params =
                service.buildPaymentIntentParams(100.00G, [orderReference: 'HC-2186-ABCDEFGH'])

        then: '100,00 € est transmis en centimes, dans la bonne devise, métadonnées incluses'
        params.amount == 10000L
        params.currency == 'eur'
        params.metadata['orderReference'] == 'HC-2186-ABCDEFGH'
    }

    void "extractPaymentIntent récupère le PaymentIntent porté par l'Event webhook"() {
        given:
        PaymentIntent pi = Mock(PaymentIntent)
        EventDataObjectDeserializer deserializer = Mock(EventDataObjectDeserializer) {
            getObject() >> Optional.of(pi)
        }
        Event event = Mock(Event) { getDataObjectDeserializer() >> deserializer }

        expect: 'le PaymentIntent est extrait, et un event nul est géré sans erreur'
        service.extractPaymentIntent(event).is(pi)
        service.extractPaymentIntent(null) == null
    }
}
