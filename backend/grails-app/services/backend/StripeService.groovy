package backend

import com.stripe.Stripe
import com.stripe.exception.SignatureVerificationException
import com.stripe.model.Event
import com.stripe.model.PaymentIntent
import com.stripe.net.Webhook
import com.stripe.param.PaymentIntentCreateParams
import org.springframework.beans.factory.annotation.Value

import javax.annotation.PostConstruct

/**
 * Encapsule le SDK Stripe.
 *
 * Mode "mock" : si STRIPE_SECRET_KEY n'est pas défini, isConfigured()
 * renvoie false ; OrderService bascule alors en paiement immédiat
 * (utile pour la CI ou une démo sans clé).
 */
class StripeService {

    @Value('${hc.stripe.secret-key:}')
    String secretKey

    @Value('${hc.stripe.publishable-key:}')
    String publishableKey

    @Value('${hc.stripe.webhook-secret:}')
    String webhookSecret

    @Value('${hc.stripe.currency:eur}')
    String currency

    @PostConstruct
    void init() {
        if (secretKey) {
            Stripe.apiKey = secretKey
            log.info('Stripe configuré (clé {})', secretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE')
        } else {
            log.warn('STRIPE_SECRET_KEY non défini — mode mock activé (paiement auto-validé).')
        }
    }

    boolean isConfigured() {
        secretKey?.trim()
    }

    /**
     * Crée un PaymentIntent côté Stripe.
     * @param amount montant total en euros (BigDecimal). Sera converti en centimes.
     * @param metadata clés/valeurs attachées au PI (ex: orderReference).
     */
    Map createPaymentIntent(BigDecimal amount, Map<String, String> metadata) {
        if (!isConfigured()) {
            throw new IllegalStateException('Stripe non configuré.')
        }
        long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue()

        PaymentIntentCreateParams.Builder builder = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency(currency)
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build()
                )
        metadata?.each { String k, String v ->
            if (v != null) builder.putMetadata(k, v)
        }

        PaymentIntent pi = PaymentIntent.create(builder.build())
        [
                paymentIntentId: pi.id,
                clientSecret   : pi.clientSecret,
                amount         : pi.amount,
                currency       : pi.currency,
                status         : pi.status,
        ]
    }

    /**
     * Vérifie la signature HMAC d'un webhook Stripe et retourne l'Event.
     * Throw si la signature est invalide ou si webhookSecret n'est pas défini.
     */
    Event verifyWebhook(String payload, String sigHeader) {
        if (!webhookSecret) {
            throw new IllegalStateException('STRIPE_WEBHOOK_SECRET non défini — webhook refusé.')
        }
        try {
            Webhook.constructEvent(payload, sigHeader, webhookSecret)
        } catch (SignatureVerificationException e) {
            log.warn('Webhook Stripe : signature invalide — {}', e.message)
            throw e
        }
    }

    /**
     * Extrait le PaymentIntent d'un Event webhook (payment_intent.* events).
     */
    PaymentIntent extractPaymentIntent(Event event) {
        event?.dataObjectDeserializer?.object?.orElse(null) as PaymentIntent
    }

    /**
     * Récupère un PaymentIntent côté API Stripe — utile quand le webhook
     * n'a pas pu être relayé (dev sans Stripe CLI) : permet au frontend
     * de forcer la synchro du statut.
     */
    PaymentIntent retrievePaymentIntent(String paymentIntentId) {
        if (!isConfigured()) {
            throw new IllegalStateException('Stripe non configuré.')
        }
        if (!paymentIntentId) return null
        PaymentIntent.retrieve(paymentIntentId)
    }
}
