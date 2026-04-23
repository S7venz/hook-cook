package backend

import grails.gorm.transactions.Transactional

@Transactional
class ContestRegistrationService {

    MailService mailService
    StripeService stripeService

    Map register(User user, String contestId, Map payload) {
        if (!user) return [error: 'Authentification requise.']
        Contest contest = Contest.get(contestId)
        if (!contest) return [error: 'Concours introuvable.']
        ContestRegistration existing = ContestRegistration.findByUserAndContest(user, contest)
        if (existing) {
            if (existing.status == 'pending_payment' && stripeService?.isConfigured()) {
                // Reprendre le paiement abandonné — recrée un PaymentIntent
                return resumePaymentForExisting(existing, contest, user)
            }
            return [error: 'Vous êtes déjà inscrit à ce concours.']
        }

        boolean stripeOn = stripeService?.isConfigured() && (contest.price ?: 0) > 0
        ContestRegistration reg = new ContestRegistration(
                user        : user,
                contest     : contest,
                category    : payload.category ?: 'hommes-am',
                permitNumber: payload.permitNumber,
                status      : stripeOn ? 'pending_payment' : 'paid',
        )
        if (!reg.save(flush: true)) {
            return [error: 'Inscription impossible.']
        }

        if (stripeOn) {
            try {
                Map intent = stripeService.createPaymentIntent(
                        contest.price,
                        [kind: 'contest', contestRegId: reg.id?.toString(), contestId: contest.id, userId: user.id?.toString()],
                )
                reg.stripePaymentIntentId = intent.paymentIntentId as String
                reg.save(flush: true)
                return [
                        registration   : reg,
                        clientSecret   : intent.clientSecret,
                        publishableKey : stripeService.publishableKey,
                ]
            } catch (Exception e) {
                log.error('Échec création PaymentIntent concours {} : {}', contest.id, e.message)
                reg.status = 'payment_failed'
                reg.save(flush: true)
                return [error: 'Impossible d\'initialiser le paiement.']
            }
        }

        // Inscription gratuite : valide direct
        contest.inscrits = (contest.inscrits ?: 0) + 1
        contest.save(flush: true)
        mailService?.contestRegistration(reg)
        [registration: reg]
    }

    private Map resumePaymentForExisting(ContestRegistration reg, Contest contest, User user) {
        try {
            Map intent = stripeService.createPaymentIntent(
                    contest.price,
                    [kind: 'contest', contestRegId: reg.id?.toString(), contestId: contest.id, userId: user.id?.toString()],
            )
            reg.stripePaymentIntentId = intent.paymentIntentId as String
            reg.save(flush: true)
            [registration: reg, clientSecret: intent.clientSecret, publishableKey: stripeService.publishableKey]
        } catch (Exception e) {
            log.error('Échec resume PaymentIntent concours {} : {}', contest.id, e.message)
            [error: 'Impossible d\'initialiser le paiement.']
        }
    }

    /**
     * Marque l'inscription comme payée (status 'paid' + incrément inscrits + email).
     * Idempotent.
     */
    Map markPaidByPaymentIntent(String paymentIntentId) {
        if (!paymentIntentId) return [error: 'paymentIntentId requis.']
        ContestRegistration reg = ContestRegistration.findByStripePaymentIntentId(paymentIntentId)
        if (!reg) return [error: 'Inscription introuvable pour ce PaymentIntent.']
        if (reg.status == 'paid') return [registration: reg, alreadyProcessed: true]
        reg.status = 'paid'
        reg.save(flush: true)
        Contest c = reg.contest
        if (c) {
            c.inscrits = (c.inscrits ?: 0) + 1
            c.save(flush: true)
        }
        mailService?.contestRegistration(reg)
        [registration: reg]
    }

    Map markPaymentFailedByPaymentIntent(String paymentIntentId) {
        if (!paymentIntentId) return [error: 'paymentIntentId requis.']
        ContestRegistration reg = ContestRegistration.findByStripePaymentIntentId(paymentIntentId)
        if (!reg) return [error: 'Inscription introuvable.']
        if (reg.status == 'paid') return [registration: reg, alreadyProcessed: true]
        reg.status = 'payment_failed'
        reg.save(flush: true)
        [registration: reg]
    }

    Map syncFromStripe(Long regId) {
        if (!stripeService?.isConfigured()) return [error: 'Stripe non configuré.']
        ContestRegistration reg = ContestRegistration.get(regId)
        if (!reg) return [error: 'Inscription introuvable.']
        if (reg.status == 'paid') return [registration: reg, alreadyProcessed: true]
        if (!reg.stripePaymentIntentId) return [error: 'Aucun PaymentIntent associé.']
        def pi = stripeService.retrievePaymentIntent(reg.stripePaymentIntentId)
        if (!pi) return [error: 'PaymentIntent introuvable.']
        switch (pi.status) {
            case 'succeeded': return markPaidByPaymentIntent(reg.stripePaymentIntentId)
            case 'canceled':
            case 'requires_payment_method': return markPaymentFailedByPaymentIntent(reg.stripePaymentIntentId)
            default: return [registration: reg, pending: true, stripeStatus: pi.status]
        }
    }

    List<ContestRegistration> forUser(User user) {
        ContestRegistration.findAllByUser(user, [sort: 'dateCreated', order: 'desc'])
    }

    List<ContestRegistration> all() {
        ContestRegistration.list(sort: 'dateCreated', order: 'desc')
    }
}
