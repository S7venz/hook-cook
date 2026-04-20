package backend

import grails.gorm.transactions.Transactional
import groovy.json.JsonOutput

import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Transactional
class PermitService {

    MailService mailService

    static final Map<String, Map> TYPES = [
            annuel    : [title: 'Permis annuel', price: 92.0],
            semaine   : [title: 'Permis semaine', price: 28.0],
            decouverte: [title: 'Découverte', price: 6.0],
    ]

    private static String generateReference() {
        int rand = (int) (10000 + Math.random() * 89999)
        "FR-2026-${rand}"
    }

    private static DateTimeFormatter FMT = DateTimeFormatter
            .ofPattern('dd/MM/yyyy HH:mm').withZone(ZoneId.systemDefault())

    private static List<Map> initialHistory(Instant now) {
        String submitted = FMT.format(now)
        String paid = FMT.format(now.plusSeconds(180))
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
        Map type = TYPES[typeId]
        if (!type) return [error: 'Type de permis invalide.']

        Instant now = Instant.now()
        Permit permit = new Permit(
                reference  : generateReference(),
                user       : user,
                typeId     : typeId,
                typeTitle  : type.title,
                amount     : type.price,
                department : payload.department ?: '66 — Pyrénées-Orientales',
                firstName  : payload.firstName ?: user.firstName,
                lastName   : payload.lastName ?: user.lastName,
                birthDate  : payload.birthDate ?: '',
                status     : 'pending',
                statusLabel: 'En instruction',
        )
        permit.history = initialHistory(now)

        if (!permit.save(flush: true)) {
            return [error: 'Impossible de créer la demande.']
        }
        [permit: permit]
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
