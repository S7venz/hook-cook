package backend

import com.stripe.exception.SignatureVerificationException
import com.stripe.model.Event
import com.stripe.model.PaymentIntent
import grails.converters.JSON

/**
 * Endpoints Stripe :
 *   - POST /api/payments/webhook : reçoit les events Stripe (PUBLIC, signature HMAC)
 *   - POST /api/payments/sync/:reference : force la synchro avec Stripe (auth)
 *
 * Le webhook est PUBLIC (pas de JWT) car il est appelé par les serveurs
 * Stripe — la sécurité repose sur la vérification de la signature HMAC.
 */
class PaymentController {

    static responseFormats = ['json']
    static allowedMethods = [
            webhook       : 'POST',
            sync          : 'POST',
            syncPermit    : 'POST',
            syncContestReg: 'POST',
    ]

    AuthService authService
    StripeService stripeService
    OrderService orderService
    PermitService permitService
    ContestRegistrationService contestRegistrationService

    def webhook() {
        String sigHeader = request.getHeader('Stripe-Signature')
        if (!sigHeader) {
            response.status = 400
            render([error: 'Signature manquante.'] as JSON)
            return
        }

        String payload = request.inputStream.getText('UTF-8')
        Event event
        try {
            event = stripeService.verifyWebhook(payload, sigHeader)
        } catch (SignatureVerificationException e) {
            response.status = 400
            render([error: 'Signature invalide.'] as JSON)
            return
        } catch (IllegalStateException e) {
            response.status = 503
            render([error: e.message] as JSON)
            return
        } catch (Exception e) {
            log.error('Webhook Stripe : exception inattendue — {}', e.message)
            response.status = 400
            render([error: 'Webhook invalide.'] as JSON)
            return
        }

        log.info('Webhook Stripe reçu : type={} id={}', event.type, event.id)

        switch (event.type) {
            case 'payment_intent.succeeded':
                PaymentIntent pi = stripeService.extractPaymentIntent(event)
                if (pi) routePaid(pi)
                break
            case 'payment_intent.payment_failed':
                PaymentIntent pi = stripeService.extractPaymentIntent(event)
                if (pi) routeFailed(pi)
                break
            default:
                log.debug('Webhook Stripe ignoré (type non géré) : {}', event.type)
        }

        // Stripe attend un 200 quoi qu'il arrive, sinon il retentera l'event.
        render([received: true] as JSON)
    }

    /**
     * Dispatch un payment_intent.succeeded vers le bon service selon
     * la metadata "kind" attachée au PaymentIntent (order/permit/contest).
     * Fallback : tente d'abord OrderService (legacy commandes sans metadata).
     */
    private void routePaid(PaymentIntent pi) {
        String kind = pi.metadata?.get('kind')
        Map result
        switch (kind) {
            case 'permit':
                result = permitService.markPaidByPaymentIntent(pi.id); break
            case 'contest':
                result = contestRegistrationService.markPaidByPaymentIntent(pi.id); break
            case 'order':
            default:
                result = orderService.markPaidByPaymentIntent(pi.id); break
        }
        if (result?.error) {
            log.warn('markPaid({}) a échoué pour PI={} : {}', kind ?: 'order', pi.id, result.error)
        }
    }

    private void routeFailed(PaymentIntent pi) {
        String kind = pi.metadata?.get('kind')
        switch (kind) {
            case 'permit':
                permitService.markPaymentFailedByPaymentIntent(pi.id); break
            case 'contest':
                contestRegistrationService.markPaymentFailedByPaymentIntent(pi.id); break
            case 'order':
            default:
                orderService.markFailedByPaymentIntent(pi.id); break
        }
    }

    /**
     * Force la synchronisation du statut d'une commande avec Stripe.
     * Sert de fallback quand le webhook n'arrive pas (dev local sans
     * `stripe listen`, ou cluster derrière un load balancer mal configuré).
     * L'utilisateur ne peut sync que SES commandes ; admin = toutes.
     */
    def sync() {
        Map check = authService.userFromRequest(request)
        if (!check.user) {
            response.status = 401
            render([error: 'Authentification requise.'] as JSON)
            return
        }
        User user = check.user
        String reference = params.reference
        CustomerOrder order = orderService.findByReference(reference)
        if (!order) {
            response.status = 404
            render([error: 'Commande introuvable.'] as JSON)
            return
        }
        boolean isAdmin = user.role == 'ROLE_ADMIN'
        if (!isAdmin && order.user.id != user.id) {
            response.status = 403
            render([error: 'Commande non autorisée.'] as JSON)
            return
        }

        Map result = orderService.syncFromStripe(reference)
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        Map body = [order: result.order.toApiMap()]
        if (result.alreadyProcessed) body.alreadyProcessed = true
        if (result.stripeStatus) body.stripeStatus = result.stripeStatus
        if (result.pending) body.pending = true
        render(body as JSON)
    }

    /** Sync permit avec Stripe (fallback webhook). */
    def syncPermit() {
        Map check = authService.userFromRequest(request)
        if (!check.user) {
            response.status = 401
            render([error: 'Authentification requise.'] as JSON)
            return
        }
        User user = check.user
        Permit permit = permitService.findByReference(params.reference)
        if (!permit) {
            response.status = 404
            render([error: 'Permis introuvable.'] as JSON)
            return
        }
        boolean isAdmin = user.role == 'ROLE_ADMIN'
        if (!isAdmin && permit.user.id != user.id) {
            response.status = 403
            render([error: 'Permis non autorisé.'] as JSON)
            return
        }
        Map result = permitService.syncFromStripe(params.reference)
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        Map body = [permit: result.permit.toApiMap()]
        if (result.alreadyProcessed) body.alreadyProcessed = true
        if (result.stripeStatus) body.stripeStatus = result.stripeStatus
        if (result.pending) body.pending = true
        render(body as JSON)
    }

    /** Sync inscription concours avec Stripe. */
    def syncContestReg() {
        Map check = authService.userFromRequest(request)
        if (!check.user) {
            response.status = 401
            render([error: 'Authentification requise.'] as JSON)
            return
        }
        User user = check.user
        Long regId = params.long('id')
        if (!regId) {
            response.status = 400
            render([error: 'Identifiant invalide.'] as JSON)
            return
        }
        ContestRegistration reg = ContestRegistration.get(regId)
        if (!reg) {
            response.status = 404
            render([error: 'Inscription introuvable.'] as JSON)
            return
        }
        boolean isAdmin = user.role == 'ROLE_ADMIN'
        if (!isAdmin && reg.user.id != user.id) {
            response.status = 403
            render([error: 'Inscription non autorisée.'] as JSON)
            return
        }
        Map result = contestRegistrationService.syncFromStripe(regId)
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        Map body = [registration: result.registration.toApiMap()]
        if (result.alreadyProcessed) body.alreadyProcessed = true
        if (result.stripeStatus) body.stripeStatus = result.stripeStatus
        if (result.pending) body.pending = true
        render(body as JSON)
    }
}
