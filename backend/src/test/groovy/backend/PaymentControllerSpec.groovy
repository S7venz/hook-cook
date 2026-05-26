package backend

import com.stripe.exception.SignatureVerificationException
import com.stripe.model.Event
import com.stripe.model.PaymentIntent
import grails.testing.web.controllers.ControllerUnitTest
import spock.lang.Specification

class PaymentControllerSpec extends Specification implements ControllerUnitTest<PaymentController> {

    void "webhook refuse une requête sans header Stripe-Signature"() {
        given:
        controller.stripeService = Mock(StripeService)
        controller.orderService = Mock(OrderService)
        controller.webhookIdempotencyService = Mock(WebhookIdempotencyService) { acquire(_) >> true }
        request.method = 'POST'
        request.contentType = 'application/json'
        request.content = '{}'.bytes

        when:
        controller.webhook()

        then:
        response.status == 400
        response.json.error == 'Signature manquante.'
    }

    void "webhook refuse une signature invalide"() {
        given:
        controller.stripeService = Mock(StripeService) {
            verifyWebhook(_, _) >> {
                throw new SignatureVerificationException('bad sig', 'sig_header')
            }
        }
        controller.orderService = Mock(OrderService)
        controller.webhookIdempotencyService = Mock(WebhookIdempotencyService) { acquire(_) >> true }
        request.method = 'POST'
        request.contentType = 'application/json'
        request.addHeader('Stripe-Signature', 't=123,v1=fake')
        request.content = '{}'.bytes

        when:
        controller.webhook()

        then:
        response.status == 400
        response.json.error == 'Signature invalide.'
    }

    void "webhook payment_intent.succeeded déclenche markPaidByPaymentIntent"() {
        given:
        PaymentIntent pi = Mock(PaymentIntent) { getId() >> 'pi_test_succeed' }
        Event event = Mock(Event) { getType() >> 'payment_intent.succeeded'; getId() >> 'evt_1' }
        StripeService stripe = Mock(StripeService) {
            verifyWebhook(_, _) >> event
            extractPaymentIntent(event) >> pi
        }
        OrderService orders = Mock(OrderService)
        controller.stripeService = stripe
        controller.orderService = orders
        controller.webhookIdempotencyService = Mock(WebhookIdempotencyService) { acquire('evt_1') >> true }

        request.method = 'POST'
        request.contentType = 'application/json'
        request.addHeader('Stripe-Signature', 't=123,v1=valid')
        request.content = '{"type":"payment_intent.succeeded"}'.bytes

        when:
        controller.webhook()

        then:
        1 * orders.markPaidByPaymentIntent('pi_test_succeed') >> [order: null]
        response.status == 200
        response.json.received == true
    }

    void "webhook payment_intent.payment_failed déclenche markFailedByPaymentIntent"() {
        given:
        PaymentIntent pi = Mock(PaymentIntent) { getId() >> 'pi_test_fail' }
        Event event = Mock(Event) { getType() >> 'payment_intent.payment_failed'; getId() >> 'evt_2' }
        StripeService stripe = Mock(StripeService) {
            verifyWebhook(_, _) >> event
            extractPaymentIntent(event) >> pi
        }
        OrderService orders = Mock(OrderService)
        controller.stripeService = stripe
        controller.orderService = orders
        controller.webhookIdempotencyService = Mock(WebhookIdempotencyService) { acquire('evt_2') >> true }

        request.method = 'POST'
        request.contentType = 'application/json'
        request.addHeader('Stripe-Signature', 't=123,v1=valid')
        request.content = '{"type":"payment_intent.payment_failed"}'.bytes

        when:
        controller.webhook()

        then:
        1 * orders.markFailedByPaymentIntent('pi_test_fail') >> [order: null]
        response.status == 200
        response.json.received == true
    }

    void "webhook avec event non géré renvoie 200 sans rien appeler"() {
        given:
        Event event = Mock(Event) { getType() >> 'customer.created'; getId() >> 'evt_3' }
        StripeService stripe = Mock(StripeService) { verifyWebhook(_, _) >> event }
        OrderService orders = Mock(OrderService)
        controller.stripeService = stripe
        controller.orderService = orders
        controller.webhookIdempotencyService = Mock(WebhookIdempotencyService) { acquire('evt_3') >> true }

        request.method = 'POST'
        request.contentType = 'application/json'
        request.addHeader('Stripe-Signature', 't=123,v1=valid')
        request.content = '{}'.bytes

        when:
        controller.webhook()

        then:
        0 * orders.markPaidByPaymentIntent(_)
        0 * orders.markFailedByPaymentIntent(_)
        response.status == 200
        response.json.received == true
    }

    void "webhook ignore un event déjà traité (idempotence Redis)"() {
        given: 'un event id qui a déjà été marqué comme vu côté Redis'
        Event event = Mock(Event) { getType() >> 'payment_intent.succeeded'; getId() >> 'evt_dup' }
        StripeService stripe = Mock(StripeService) { verifyWebhook(_, _) >> event }
        OrderService orders = Mock(OrderService)
        controller.stripeService = stripe
        controller.orderService = orders
        controller.webhookIdempotencyService = Mock(WebhookIdempotencyService) { acquire('evt_dup') >> false }

        request.method = 'POST'
        request.contentType = 'application/json'
        request.addHeader('Stripe-Signature', 't=123,v1=valid')
        request.content = '{}'.bytes

        when:
        controller.webhook()

        then: 'aucun re-traitement et 200 retourné avec drapeau duplicate'
        0 * stripe.extractPaymentIntent(_)
        0 * orders.markPaidByPaymentIntent(_)
        0 * orders.markFailedByPaymentIntent(_)
        response.status == 200
        response.json.received == true
        response.json.duplicate == true
    }
}
