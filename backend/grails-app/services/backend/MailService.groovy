package backend

import backend.mail.EmailTemplates
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.SimpleMailMessage
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper

import javax.mail.internet.MimeMessage

/**
 * Notifications transactionnelles.
 *
 * Comportement :
 *   - Si SMTP configuré (spring.mail.host défini) : envoi multipart/alternative
 *     (HTML + plain text fallback) via JavaMailSender.
 *   - Sinon : log les emails dans la console (mode dev).
 *
 * Templates HTML : voir backend.mail.EmailTemplates.
 */
class MailService {

    @Autowired(required = false)
    JavaMailSender javaMailSender

    @Value('${spring.mail.host:}')
    String mailHost

    @Value('${hc.mail.from:noreply@hookcook.fr}')
    String fromAddress

    @Value('${hc.frontend.url:http://localhost:5173}')
    String frontendUrl

    /**
     * Envoi simple texte (rétro-compat — utilisé par StockAlertService).
     */
    boolean send(String to, String subject, String body) {
        sendMultipart(to, subject, body, null)
    }

    /**
     * Envoi multipart/alternative : version texte + version HTML.
     * Si le HTML est null, retombe sur le texte simple.
     */
    boolean sendMultipart(String to, String subject, String plainText, String htmlBody) {
        if (javaMailSender && mailHost) {
            try {
                if (htmlBody) {
                    MimeMessage mime = javaMailSender.createMimeMessage()
                    MimeMessageHelper helper = new MimeMessageHelper(mime, true, 'UTF-8')
                    helper.setFrom(fromAddress)
                    helper.setTo(to)
                    helper.setSubject(subject)
                    helper.setText(plainText, htmlBody) // text + html → multipart/alternative
                    javaMailSender.send(mime)
                } else {
                    SimpleMailMessage message = new SimpleMailMessage()
                    message.from = fromAddress
                    message.to = to
                    message.subject = subject
                    message.text = plainText
                    javaMailSender.send(message)
                }
                log.info('Mail envoyé à {} — {}', to, subject)
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
=======================================================''', to, subject, plainText
        true
    }

    void permitDecision(Permit permit) {
        if (!permit?.user?.email) return
        boolean approved = permit.status == 'approved'
        String statusColor = approved ? '#1F7A4D' : '#A2452B'  // vert ou rouge ocre
        String statusLabel = permit.statusLabel?.toUpperCase()

        String content = EmailTemplates.hero(
                approved ? 'Votre permis est approuvé' : 'Votre demande de permis',
                approved
                        ? "Bonne nouvelle ${permit.firstName} — votre permis ${permit.reference} est désormais actif. Vous pouvez le télécharger depuis votre espace personnel."
                        : "Bonjour ${permit.firstName}, votre demande de permis ${permit.reference} a été ${permit.statusLabel?.toLowerCase()}. Vous pouvez en soumettre une nouvelle quand vous voulez.",
                statusLabel,
                statusColor,
        )

        content += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:0 40px 8px;">'
        content += EmailTemplates.infoCard('Détails', [
                [label: 'Numéro', value: permit.reference],
                [label: 'Type', value: permit.typeTitle ?: '—'],
                [label: 'Décision', value: permit.statusLabel ?: '—'],
        ])
        content += EmailTemplates.button(
                approved ? 'Voir mon permis' : 'Faire une nouvelle demande',
                approved ? "${frontendUrl}/compte" : "${frontendUrl}/permis",
        )
        content += '</td></tr></table><div style="height:24px;"></div>'

        String html = EmailTemplates.layout(
                "Permis ${permit.reference} — ${permit.statusLabel}",
                content,
                frontendUrl,
        )
        String plain = EmailTemplates.htmlToPlainText(content)

        sendMultipart(
                permit.user.email,
                "Permis ${permit.reference} — ${permit.statusLabel}",
                plain,
                html,
        )
    }

    void orderConfirmation(CustomerOrder order) {
        if (!order?.email) return

        List<Map<String, Object>> items = (order.items ?: []).collect { OrderItem it ->
            [
                    productName: it.productName,
                    qty        : it.qty,
                    unitPrice  : it.unitPrice,
            ] as Map<String, Object>
        }

        String content = EmailTemplates.hero(
                'Merci, on prépare votre commande',
                "Votre commande <strong>${order.reference}</strong> est confirmée. Vous recevrez le numéro de suivi sous 24h.",
                'PAYÉE',
                '#1F7A4D',
        )

        content += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:8px 40px 0;">'
        // Section articles
        content += '<div style="margin:8px 0 0;color:' + EmailTemplates.COLOR_INK_MUTE + ';font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;font-family:' + EmailTemplates.FONT_BODY + ';">Articles</div>'
        content += EmailTemplates.orderItems(items)
        // Totals
        content += EmailTemplates.orderTotals(order.subtotal, order.shipping, order.total)

        content += '<div style="height:8px;"></div>'

        // Livraison
        content += EmailTemplates.infoCard('Livraison', [
                [label: 'Mode', value: order.shippingMode ?: '—'],
                [label: 'Adresse', value: "${order.addressLine}<br>${order.postalCode} ${order.city}".toString()],
        ])

        content += EmailTemplates.button('Voir ma commande', "${frontendUrl}/confirmation/${order.reference}")
        content += '</td></tr></table><div style="height:24px;"></div>'

        String html = EmailTemplates.layout(
                "Commande ${order.reference} confirmée",
                content,
                frontendUrl,
        )
        String plain = EmailTemplates.htmlToPlainText(content)

        sendMultipart(
                order.email,
                "Commande ${order.reference} confirmée",
                plain,
                html,
        )
    }

    /**
     * Email de réinitialisation de mot de passe.
     */
    void passwordReset(User user, String resetUrl) {
        if (!user?.email) return

        String content = EmailTemplates.hero(
                'Réinitialisation de votre mot de passe',
                "Bonjour ${user.firstName ?: ''}, vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.",
                'LIEN VALABLE 1H',
                EmailTemplates.COLOR_ACCENT,
        )

        content += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:8px 40px 0;">'
        content += EmailTemplates.button('Choisir un nouveau mot de passe', resetUrl)
        content += '<p style="margin:16px 0 0;color:' + EmailTemplates.COLOR_INK_MUTE + ';font-size:12px;line-height:1.5;font-family:' + EmailTemplates.FONT_BODY + ';">Si vous n\'êtes pas à l\'origine de cette demande, ignorez simplement cet email — votre mot de passe actuel reste inchangé.</p>'
        content += '<p style="margin:16px 0 0;padding:12px;background:' + EmailTemplates.COLOR_ELEV + ';border-radius:8px;color:' + EmailTemplates.COLOR_INK_MUTE + ';font-size:11px;font-family:\'JetBrains Mono\',monospace;word-break:break-all;">' + escapeHtml(resetUrl) + '</p>'
        content += '</td></tr></table><div style="height:24px;"></div>'

        String html = EmailTemplates.layout('Réinitialisation de votre mot de passe', content, frontendUrl)
        String plain = EmailTemplates.htmlToPlainText(content)
        sendMultipart(user.email, 'Réinitialisation de votre mot de passe', plain, html)
    }

    /**
     * Notification "produit de retour en stock" (StockAlert).
     */
    void stockReplenish(User user, Product product) {
        if (!user?.email || !product) return

        String price = product.price?.setScale(2, BigDecimal.ROUND_HALF_UP)?.toString()?.replace('.', ',') ?: '—'
        String content = EmailTemplates.hero(
                "${product.name} est de retour",
                "Bonne nouvelle ${user.firstName ?: ''} — l'article que vous attendiez est à nouveau disponible. Foncez avant rupture !",
                'EN STOCK',
                '#1F7A4D',
        )

        content += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:8px 40px 0;">'
        content += EmailTemplates.infoCard('Article', [
                [label: 'Produit', value: escapeHtml(product.name ?: '—')],
                [label: 'Prix', value: "${price} €".toString()],
                [label: 'Stock disponible', value: "${product.stock ?: 0} unités".toString()],
        ])
        content += EmailTemplates.button('Voir le produit', "${frontendUrl}/boutique/${product.id}")
        content += '</td></tr></table><div style="height:24px;"></div>'

        String html = EmailTemplates.layout("Retour en stock : ${product.name}", content, frontendUrl)
        String plain = EmailTemplates.htmlToPlainText(content)
        sendMultipart(user.email, "Retour en stock : ${product.name}", plain, html)
    }

    private static String escapeHtml(String s) {
        if (s == null) return ''
        s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
    }

    /**
     * Envoie un email de démonstration à une adresse arbitraire — utile
     * pour valider le rendu HTML chez les vrais clients (Gmail, Outlook…).
     * @param template 'order' | 'permit' | 'contest' | 'reset' | 'stock'
     */
    boolean sendSample(String to, String template) {
        switch (template) {
            case 'order':
                return sendSampleOrder(to)
            case 'permit':
                return sendSamplePermit(to)
            case 'contest':
                return sendSampleContest(to)
            case 'reset':
                return sendSampleReset(to)
            case 'stock':
                return sendSampleStock(to)
            default:
                throw new IllegalArgumentException("Template inconnu : ${template}")
        }
    }

    private boolean sendSampleReset(String to) {
        User fakeUser = new User(email: to, firstName: 'Cengizhan')
        passwordReset(fakeUser, "${frontendUrl}/reset-password/demo-token-abcdef123456")
        true
    }

    private boolean sendSampleStock(String to) {
        User fakeUser = new User(email: to, firstName: 'Cengizhan')
        Product fakeProduct = new Product(
                sku: 'HC-CARP-LIVE', name: 'Bouillette Carpe Live Bait 20mm — sac 1kg',
                category: 'appats', price: 18.90G, stock: 12,
        )
        fakeProduct.id = 'demo-bouillette'
        stockReplenish(fakeUser, fakeProduct)
        true
    }

    private boolean sendSampleOrder(String to) {
        // Construction d'un faux ordre en mémoire (pas de save BDD)
        CustomerOrder fake = new CustomerOrder(
                reference   : 'HC-2186-DEMO123',
                email       : to,
                addressLine : '14 rue de la République',
                postalCode  : '66000',
                city        : 'Perpignan',
                shippingMode: 'Standard Colissimo',
                subtotal    : 67.50G,
                shipping    : 5.90G,
                total       : 73.40G,
                status      : 'paid',
                statusLabel : 'Payée',
        )
        fake.items = [
                new OrderItem(
                        productId: 'demo-canne', productName: "Canne Hook & Cook Sauvage 9'5\" #6",
                        productSku: 'HC-C-095-6', unitPrice: 49.00G, qty: 1,
                ),
                new OrderItem(
                        productId: 'demo-leurre', productName: 'Leurre souple shad 8 cm (lot de 4)',
                        productSku: 'HC-L-SHAD-8', unitPrice: 9.25G, qty: 2,
                ),
        ] as Set
        orderConfirmation(fake)
        true
    }

    private boolean sendSamplePermit(String to) {
        User fakeUser = new User(email: to, firstName: 'Cengizhan')
        Permit fake = new Permit(
                user       : fakeUser,
                reference  : 'FR-2026-48291',
                firstName  : 'Cengizhan',
                typeTitle  : 'Permis annuel adulte 2026',
                status     : 'approved',
                statusLabel: 'Approuvé',
        )
        permitDecision(fake)
        true
    }

    private boolean sendSampleContest(String to) {
        User fakeUser = new User(email: to, firstName: 'Cengizhan')
        Contest fakeContest = new Contest(
                title      : 'Concours truite — Têt aval',
                dateDisplay: 'Samedi 14 mars',
                lieu       : 'Pont du diable, Céret',
        )
        ContestRegistration fake = new ContestRegistration(
                user    : fakeUser,
                contest : fakeContest,
                category: 'Truite — adulte',
        )
        contestRegistration(fake)
        true
    }

    void contestRegistration(ContestRegistration reg) {
        if (!reg?.user?.email) return

        String content = EmailTemplates.hero(
                "Inscription confirmée",
                "Bonjour ${reg.user.firstName}, vous êtes inscrit·e au concours <strong>${reg.contest.title}</strong>. Bonne pêche !",
                'CONFIRMÉE',
                '#1F7A4D',
        )

        content += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:8px 40px 0;">'
        content += EmailTemplates.infoCard('Concours', [
                [label: 'Date', value: "${reg.contest.dateDisplay} 2026".toString()],
                [label: 'Lieu', value: reg.contest.lieu ?: '—'],
                [label: 'Catégorie', value: reg.category ?: '—'],
        ])
        content += EmailTemplates.button('Voir le concours', "${frontendUrl}/concours")
        content += '</td></tr></table><div style="height:24px;"></div>'

        String html = EmailTemplates.layout(
                "Inscription au concours ${reg.contest.title}",
                content,
                frontendUrl,
        )
        String plain = EmailTemplates.htmlToPlainText(content)

        sendMultipart(
                reg.user.email,
                "Inscription au concours ${reg.contest.title}",
                plain,
                html,
        )
    }
}
