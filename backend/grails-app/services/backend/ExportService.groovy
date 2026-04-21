package backend

import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * Génère des exports CSV pour les besoins admin / comptabilité.
 *
 * Format : UTF-8 avec BOM (pour qu'Excel ouvre correctement les accents),
 * séparateur `;` (convention française, Excel en FR ne comprend pas le
 * séparateur `,` par défaut), champs entourés de guillemets seulement
 * quand nécessaire (contient `;`, `"` ou saut de ligne).
 *
 * Pas de @Transactional — service read-only, la transaction ambiante
 * du controller suffit et on évite les soucis d'isolation en test.
 */
class ExportService {

    private static final DateTimeFormatter FR_DATE_TIME = DateTimeFormatter
            .ofPattern('dd/MM/yyyy HH:mm').withZone(ZoneId.of('Europe/Paris'))

    String ordersCsv() {
        List<CustomerOrder> all = CustomerOrder.list(sort: 'dateCreated', order: 'desc')
        StringBuilder sb = new StringBuilder()
        sb.append('\uFEFF') // BOM UTF-8
        sb.append(headerRow([
                'Référence', 'Date', 'Statut',
                'Client email', 'Client prénom', 'Client nom',
                'Adresse', 'Code postal', 'Ville',
                'Mode livraison',
                'Sous-total', 'Livraison', 'Total',
                'Nombre articles',
        ]))
        all.each { o ->
            String date = o.dateCreated ? FR_DATE_TIME.format(o.dateCreated.toInstant()) : ''
            sb.append(row([
                    o.reference, date, o.statusLabel,
                    o.email, o.user?.firstName, o.user?.lastName,
                    o.addressLine, o.postalCode, o.city,
                    o.shippingMode,
                    fmt(o.subtotal), fmt(o.shipping), fmt(o.total),
                    (o.items?.size() ?: 0).toString(),
            ]))
        }
        sb.toString()
    }

    String permitsCsv() {
        List<Permit> all = Permit.list(sort: 'dateCreated', order: 'desc')
        StringBuilder sb = new StringBuilder()
        sb.append('\uFEFF')
        sb.append(headerRow([
                'Référence', 'Date dépôt', 'Statut',
                'Type permis', 'Montant',
                'Demandeur email', 'Demandeur prénom', 'Demandeur nom',
                'Date de naissance', 'Département',
        ]))
        all.each { p ->
            String date = p.dateCreated ? FR_DATE_TIME.format(p.dateCreated.toInstant()) : ''
            sb.append(row([
                    p.reference, date, p.statusLabel,
                    p.typeTitle, fmt(p.amount),
                    p.user?.email, p.firstName, p.lastName,
                    p.birthDate, p.department,
            ]))
        }
        sb.toString()
    }

    String contestRegistrationsCsv() {
        List<ContestRegistration> all = ContestRegistration.list(sort: 'dateCreated', order: 'desc')
        StringBuilder sb = new StringBuilder()
        sb.append('\uFEFF')
        sb.append(headerRow([
                'Date inscription', 'Concours', 'Date concours',
                'Participant email', 'Participant prénom', 'Participant nom',
                'Catégorie', 'Numéro permis',
        ]))
        all.each { r ->
            String date = r.dateCreated ? FR_DATE_TIME.format(r.dateCreated.toInstant()) : ''
            sb.append(row([
                    date,
                    r.contest?.title, r.contest?.dateDisplay,
                    r.user?.email, r.user?.firstName, r.user?.lastName,
                    r.category, r.permitNumber,
            ]))
        }
        sb.toString()
    }

    // ──────────────────────── helpers ─────────────────────────────

    private static String headerRow(List<String> headers) {
        row(headers as List)
    }

    private static String row(List values) {
        values.collect { escape(it?.toString()) }.join(';') + '\r\n'
    }

    /**
     * Escape RFC 4180-ish : entoure de guillemets si contient `;`, `"`
     * ou nouvelle ligne. Double les guillemets internes.
     */
    private static String escape(String v) {
        if (v == null) return ''
        if (v.contains(';') || v.contains('"') || v.contains('\n') || v.contains('\r')) {
            return '"' + v.replace('"', '""') + '"'
        }
        v
    }

    private static String fmt(BigDecimal n) {
        if (n == null) return ''
        n.setScale(2, BigDecimal.ROUND_HALF_UP).toString().replace('.', ',')
    }
}
