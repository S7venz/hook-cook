package backend

/**
 * Notifications transactionnelles.
 *
 * Pour l'instant : log des messages dans la console backend (les mails
 * réels nécessitent un SMTP — JavaMailSender peut être branché plus
 * tard via une variable d'environnement).
 */
class MailService {

    boolean send(String to, String subject, String body) {
        log.info '''
=================== MAIL ===================
 To      : {}
 Subject : {}
 Body    :
{}
============================================''', to, subject, body
        true
    }

    void permitDecision(Permit permit) {
        if (!permit?.user?.email) return
        String body = """Bonjour ${permit.firstName},

Votre demande de permis ${permit.id} (${permit.typeTitle}) a été ${permit.statusLabel.toLowerCase()}.

${permit.status == 'approved' ?
        "Votre carte est disponible dans votre espace personnel Hook & Cook." :
        "Vous pouvez soumettre une nouvelle demande depuis votre espace."}

— L'équipe Hook & Cook
"""
        send(permit.user.email, "Permis ${permit.id} — ${permit.statusLabel}", body)
    }

    void orderConfirmation(CustomerOrder order) {
        if (!order?.email) return
        String itemsText = order.items.collect { "• ${it.qty}× ${it.productName}" }.join('\n')
        String body = """Bonjour,

Votre commande ${order.reference} est confirmée.

Articles :
${itemsText}

Total : ${order.total} €

Livraison : ${order.shippingMode} — ${order.addressLine}, ${order.postalCode} ${order.city}

— L'équipe Hook & Cook
"""
        send(order.email, "Commande ${order.reference} confirmée", body)
    }

    void contestRegistration(ContestRegistration reg) {
        if (!reg?.user?.email) return
        String body = """Bonjour ${reg.user.firstName},

Votre inscription au concours « ${reg.contest.title} » est confirmée.

Date : ${reg.contest.dateDisplay} 2026
Lieu : ${reg.contest.lieu}
Catégorie : ${reg.category}

— L'équipe Hook & Cook
"""
        send(reg.user.email, "Inscription au concours ${reg.contest.title}", body)
    }
}
