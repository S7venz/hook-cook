package backend

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender

/**
 * Notifications transactionnelles.
 *
 * Comportement :
 *   - Si un SMTP est configuré (spring.mail.host défini), envoie un vrai mail via JavaMailSender.
 *   - Sinon, écrit le contenu du mail dans les logs (mode développement).
 */
class MailService {

    @Autowired(required = false)
    JavaMailSender javaMailSender

    @Value('${spring.mail.host:}')
    String mailHost

    @Value('${hc.mail.from:noreply@hookcook.fr}')
    String fromAddress

    boolean send(String to, String subject, String body) {
        if (javaMailSender && mailHost) {
            try {
                SimpleMailMessage message = new SimpleMailMessage()
                message.from = fromAddress
                message.to = to
                message.subject = subject
                message.text = body
                javaMailSender.send(message)
                log.info('Mail envoyé via SMTP à {} — {}', to, subject)
                return true
            } catch (Exception e) {
                log.error('Erreur envoi SMTP ({}), fallback log', e.message)
            }
        }

        log.info '''
=================== MAIL (LOG-ONLY) ===================
 To      : {}
 Subject : {}
 Body    :
{}
=======================================================''', to, subject, body
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
