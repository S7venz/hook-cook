package backend

import grails.gorm.transactions.Transactional
import groovy.json.JsonOutput

import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Transactional
class PermitService {

    MailService mailService
    StripeService stripeService

    private static String generateReference() {
        // UUID tronqué plutôt que Math.random() — sur 5 chiffres on avait
        // seulement 90k valeurs et un PRNG prédictible.
        String suffix = UUID.randomUUID().toString().replace('-', '').take(10).toUpperCase()
        "FR-2026-${suffix}"
    }

    private static DateTimeFormatter FMT = DateTimeFormatter
            .ofPattern('dd/MM/yyyy HH:mm').withZone(ZoneId.systemDefault())

    private static List<Map> pendingPaymentHistory(Instant now) {
        String submitted = FMT.format(now)
        [
                [label: 'Demande créée', date: submitted, done: true, current: true],
                [label: 'Paiement', date: null, done: false],
                [label: 'En instruction (fédération)', date: null, done: false],
                [label: 'Décision', date: null, done: false],
        ]
    }

    private static List<Map> paidHistory(Instant now) {
        String submitted = FMT.format(now.minusSeconds(60))
        String paid = FMT.format(now)
        String instructed = FMT.format(now.plusSeconds(3600))
        [
                [label: 'Demande envoyée', date: submitted, done: true],
                [label: 'Paiement confirmé', date: paid, done: true],
                [label: 'En instruction (fédération)', date: instructed, done: true, current: true],
                [label: 'Décision', date: null, done: false],
        ]
    }

    Map create(User user, Map payload) {
        if (!user) return [error: 'Authentification requise.']
        String typeId = payload.typeId ?: 'annuel'
        PermitType type = PermitType.get(typeId)
        if (!type) return [error: 'Type de permis invalide.']

        String department = payload.department
        if (department) {
            // Accept either a department code ("66") or the full name ("66 — Pyrénées-Orientales").
            Department dep = Department.get(department) ?: Department.findByName(department)
            if (!dep) return [error: 'Département invalide.']
            department = dep.name
        } else {
            Department dep = Department.findByName('66 — Pyrénées-Orientales') ?: Department.list(max: 1)[0]
            department = dep?.name ?: '66 — Pyrénées-Orientales'
        }

        boolean stripeOn = stripeService?.isConfigured() && (type.price ?: 0) > 0
        Instant now = Instant.now()
        Permit permit = new Permit(
                reference  : generateReference(),
                user       : user,
                typeId     : typeId,
                typeTitle  : type.title,
                amount     : type.price,
                department : department,
                firstName  : payload.firstName ?: user.firstName,
                lastName   : payload.lastName ?: user.lastName,
                birthDate  : payload.birthDate ?: '',
                status     : stripeOn ? 'pending_payment' : 'pending',
                statusLabel: stripeOn ? 'En attente de paiement' : 'En instruction',
                idDocUrl   : payload.idDocUrl,
                photoDocUrl: payload.photoDocUrl,
        )
        permit.history = stripeOn ? pendingPaymentHistory(now) : paidHistory(now)

        if (!permit.save(flush: true)) {
            return [error: 'Impossible de créer la demande.']
        }

        if (stripeOn) {
            try {
                Map intent = stripeService.createPaymentIntent(
                        permit.amount,
                        [kind: 'permit', permitReference: permit.reference, userId: user.id?.toString()],
                )
                permit.stripePaymentIntentId = intent.paymentIntentId as String
                permit.save(flush: true)
                return [
                        permit         : permit,
                        clientSecret   : intent.clientSecret,
                        publishableKey : stripeService.publishableKey,
                ]
            } catch (Exception e) {
                log.error('Échec création PaymentIntent permis {} : {}', permit.reference, e.message)
                permit.status = 'payment_failed'
                permit.statusLabel = 'Paiement échoué'
                permit.save(flush: true)
                return [error: 'Impossible d\'initialiser le paiement.']
            }
        }

        [permit: permit]
    }

    /**
     * Marque le permis comme payé (passe à status "pending"/En instruction)
     * suite à un webhook Stripe payment_intent.succeeded. Idempotent.
     */
    Map markPaidByPaymentIntent(String paymentIntentId) {
        if (!paymentIntentId) return [error: 'paymentIntentId requis.']
        Permit permit = Permit.findByStripePaymentIntentId(paymentIntentId)
        if (!permit) return [error: 'Permis introuvable pour ce PaymentIntent.']
        if (permit.status in ['pending', 'approved']) {
            return [permit: permit, alreadyProcessed: true]
        }
        permit.status = 'pending'
        permit.statusLabel = 'En instruction'
        permit.history = paidHistory(Instant.now())
        if (!permit.save(flush: true)) {
            return [error: 'Mise à jour impossible.']
        }
        [permit: permit]
    }

    Map markPaymentFailedByPaymentIntent(String paymentIntentId) {
        if (!paymentIntentId) return [error: 'paymentIntentId requis.']
        Permit permit = Permit.findByStripePaymentIntentId(paymentIntentId)
        if (!permit) return [error: 'Permis introuvable.']
        if (permit.status == 'pending' || permit.status == 'approved') return [permit: permit, alreadyProcessed: true]
        permit.status = 'payment_failed'
        permit.statusLabel = 'Paiement échoué'
        permit.save(flush: true)
        [permit: permit]
    }

    Map syncFromStripe(String reference) {
        if (!stripeService?.isConfigured()) return [error: 'Stripe non configuré.']
        Permit permit = findByReference(reference)
        if (!permit) return [error: 'Permis introuvable.']
        if (permit.status in ['pending', 'approved']) return [permit: permit, alreadyProcessed: true]
        if (!permit.stripePaymentIntentId) return [error: 'Aucun PaymentIntent associé.']
        def pi = stripeService.retrievePaymentIntent(permit.stripePaymentIntentId)
        if (!pi) return [error: 'PaymentIntent introuvable.']
        switch (pi.status) {
            case 'succeeded': return markPaidByPaymentIntent(permit.stripePaymentIntentId)
            case 'canceled':
            case 'requires_payment_method': return markPaymentFailedByPaymentIntent(permit.stripePaymentIntentId)
            default: return [permit: permit, pending: true, stripeStatus: pi.status]
        }
    }

    Permit currentForUser(User user) {
        Permit.findByUser(user, [sort: 'dateCreated', order: 'desc'])
    }

    List<Permit> allForUser(User user) {
        Permit.findAllByUser(user, [sort: 'dateCreated', order: 'desc'])
    }

    List<Permit> all() {
        Permit.list(sort: 'dateCreated', order: 'desc')
    }

    Permit findByReference(String reference) {
        Permit.findByReference(reference)
    }

    Map updateStatus(String reference, String status) {
        Permit permit = findByReference(reference)
        if (!permit) return [error: 'Permis introuvable.']
        Map decisions = [
                approved: [label: 'Approuvé', historyLabel: 'Approuvé par la fédération'],
                rejected: [label: 'Rejeté', historyLabel: 'Rejet notifié'],
        ]
        Map decision = decisions[status]
        if (!decision) return [error: 'Statut invalide.']

        String date = FMT.format(Instant.now())
        List<Map> history = permit.history.collect { it as Map }
        history = history.collect { step ->
            if (step.label == 'Décision') {
                return [label: decision.historyLabel, date: date, done: true, current: true]
            }
            return [label: step.label, date: step.date, done: step.done, current: false]
        }

        permit.status = status
        permit.statusLabel = decision.label
        permit.history = history
        if (!permit.save(flush: true)) {
            return [error: 'Mise à jour impossible.']
        }
        mailService?.permitDecision(permit)
        [permit: permit]
    }
}
