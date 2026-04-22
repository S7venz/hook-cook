package backend.mail

import groovy.transform.CompileStatic

/**
 * Templates HTML pour les emails transactionnels.
 *
 * Contraintes email :
 *   - Tables au lieu de flexbox/grid (Outlook < 2019 ne supporte pas le moderne CSS layout)
 *   - Inline styles uniquement (les balises <style> sont strippées par Gmail mobile)
 *   - Largeur max 600px (standard de l'industrie)
 *   - Pas de JS, pas de SVG dans le markup principal (pour Outlook)
 *   - Logo en texte stylé + point ocre (pas d'image hébergée → marche en dev local)
 */
@CompileStatic
class EmailTemplates {

    // Palette extraite des tokens.css du frontend (oklch → hex)
    static final String COLOR_BG = '#EBE6D6'        // ivoire papier sombre
    static final String COLOR_CARD = '#F5F1E6'      // ivoire papier (fond carte)
    static final String COLOR_ELEV = '#FAF7EC'      // ivoire élevé (footer)
    static final String COLOR_INK = '#14233F'       // bleu encre nuit
    static final String COLOR_INK_SOFT = '#4F5A75'  // bleu encre soft
    static final String COLOR_INK_MUTE = '#7B8295'  // bleu encre muet
    static final String COLOR_ACCENT = '#B15E2F'    // ocre rouille
    static final String COLOR_ACCENT_SOFT = '#F0DDC8'
    static final String COLOR_HAIRLINE = 'rgba(20,35,63,0.08)'
    static final String FONT_DISPLAY = "'Fraunces', Georgia, 'Times New Roman', serif"
    static final String FONT_BODY = "'Inter', 'Helvetica Neue', Arial, sans-serif"

    /**
     * Layout commun : header avec logo + container blanc + footer.
     * @param frontendUrl URL de base (utilisée pour le lien du logo et du footer)
     */
    static String layout(String title, String contentHtml, String frontendUrl = 'http://localhost:5173') {
        """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR_BG};font-family:${FONT_BODY};color:${COLOR_INK};-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR_BG};padding:40px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:${COLOR_CARD};border-radius:14px;overflow:hidden;border:1px solid ${COLOR_HAIRLINE};box-shadow:0 4px 24px rgba(20,35,63,0.06);">

      <!-- Header avec logo -->
      <tr><td style="padding:32px 40px 20px;border-bottom:1px solid ${COLOR_HAIRLINE};">
        <a href="${frontendUrl}" style="text-decoration:none;color:${COLOR_INK};">
          <span style="font-family:${FONT_DISPLAY};font-size:26px;font-weight:500;letter-spacing:-0.02em;font-style:italic;">Hook &amp; Cook</span>
          <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${COLOR_ACCENT};margin-left:7px;vertical-align:middle;"></span>
        </a>
      </td></tr>

      <!-- Contenu -->
      <tr><td style="padding:0;">${contentHtml}</td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 40px 28px;background:${COLOR_ELEV};border-top:1px solid ${COLOR_HAIRLINE};">
        <p style="margin:0 0 8px;color:${COLOR_INK_SOFT};font-size:13px;line-height:1.5;font-family:${FONT_BODY};">
          <strong style="color:${COLOR_INK};font-family:${FONT_DISPLAY};font-style:italic;">Hook &amp; Cook</strong> · Boutique, permis et concours de pêche
        </p>
        <p style="margin:0 0 12px;color:${COLOR_INK_MUTE};font-size:12px;line-height:1.5;font-family:${FONT_BODY};">
          14 rue de la République · 66000 Perpignan · 04 68 00 00 00
        </p>
        <p style="margin:0;font-size:12px;font-family:${FONT_BODY};">
          <a href="${frontendUrl}/compte" style="color:${COLOR_ACCENT};text-decoration:none;">Mon espace</a>
          <span style="color:${COLOR_INK_MUTE};">  ·  </span>
          <a href="${frontendUrl}/aide" style="color:${COLOR_ACCENT};text-decoration:none;">Aide</a>
          <span style="color:${COLOR_INK_MUTE};">  ·  </span>
          <a href="${frontendUrl}/mentions-legales" style="color:${COLOR_ACCENT};text-decoration:none;">Mentions légales</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>"""
    }

    /**
     * Bloc hero (titre + sous-titre + éventuelle "pill" colorée pour le statut).
     */
    static String hero(String title, String lead, String statusLabel = null, String statusColor = null) {
        String pill = ''
        if (statusLabel) {
            String color = statusColor ?: COLOR_ACCENT
            pill = """<div style="margin:0 0 16px;">
              <span style="display:inline-block;padding:5px 12px;background:${COLOR_ACCENT_SOFT};color:${color};font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;border-radius:999px;font-family:${FONT_BODY};">${escape(statusLabel)}</span>
            </div>"""
        }
        """<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding:32px 40px 8px;">
    ${pill}
    <h1 style="margin:0 0 12px;font-family:${FONT_DISPLAY};font-size:30px;font-weight:400;color:${COLOR_INK};letter-spacing:-0.02em;line-height:1.2;">${escape(title)}</h1>
    <p style="margin:0;color:${COLOR_INK_SOFT};font-size:15px;line-height:1.55;font-family:${FONT_BODY};">${lead}</p>
  </td></tr>
</table>"""
    }

    /**
     * Bouton CTA principal (lien stylé en bouton).
     */
    static String button(String label, String url) {
        """<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
  <tr><td style="border-radius:8px;background:${COLOR_INK};">
    <a href="${url}" style="display:inline-block;padding:13px 28px;color:${COLOR_CARD};text-decoration:none;font-family:${FONT_BODY};font-size:14px;font-weight:600;letter-spacing:0.02em;border-radius:8px;">${escape(label)}</a>
  </td></tr>
</table>"""
    }

    /**
     * Card "info" — encadré pour mettre en valeur des données structurées.
     */
    static String infoCard(String headerLabel, List<Map<String, String>> rows) {
        String rowsHtml = rows.collect { Map<String, String> r ->
            """<tr>
              <td style="padding:8px 0;color:${COLOR_INK_MUTE};font-size:13px;font-family:${FONT_BODY};vertical-align:top;width:40%;">${escape(r.label)}</td>
              <td style="padding:8px 0;color:${COLOR_INK};font-size:14px;font-family:${FONT_BODY};vertical-align:top;font-weight:500;">${r.value}</td>
            </tr>"""
        }.join('\n')

        """<div style="margin:8px 0 0;padding:20px 24px;background:${COLOR_ELEV};border:1px solid ${COLOR_HAIRLINE};border-radius:10px;">
  <div style="margin:0 0 12px;color:${COLOR_INK_MUTE};font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;font-family:${FONT_BODY};">${escape(headerLabel)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rowsHtml}</table>
</div>"""
    }

    /**
     * Liste articles d'une commande (qty × nom + prix unitaire).
     */
    static String orderItems(List<Map<String, Object>> items) {
        String rowsHtml = items.collect { Map<String, Object> it ->
            String price = formatPrice((it.unitPrice as BigDecimal) * (it.qty as Integer))
            """<tr>
              <td style="padding:12px 0;border-bottom:1px solid ${COLOR_HAIRLINE};font-family:${FONT_BODY};font-size:14px;color:${COLOR_INK};">
                <span style="color:${COLOR_INK_MUTE};font-weight:500;">${it.qty}×</span> ${escape(it.productName as String)}
              </td>
              <td style="padding:12px 0;border-bottom:1px solid ${COLOR_HAIRLINE};font-family:'JetBrains Mono','Courier New',monospace;font-size:13px;color:${COLOR_INK};text-align:right;white-space:nowrap;">${price}</td>
            </tr>"""
        }.join('\n')
        """<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 0;">${rowsHtml}</table>"""
    }

    /**
     * Bloc total (sous-total / livraison / total).
     */
    static String orderTotals(BigDecimal subtotal, BigDecimal shipping, BigDecimal total) {
        """<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 0;">
  <tr>
    <td style="padding:6px 0;color:${COLOR_INK_MUTE};font-size:13px;font-family:${FONT_BODY};">Sous-total</td>
    <td style="padding:6px 0;font-family:'JetBrains Mono','Courier New',monospace;font-size:13px;color:${COLOR_INK};text-align:right;">${formatPrice(subtotal)}</td>
  </tr>
  <tr>
    <td style="padding:6px 0;color:${COLOR_INK_MUTE};font-size:13px;font-family:${FONT_BODY};">Livraison</td>
    <td style="padding:6px 0;font-family:'JetBrains Mono','Courier New',monospace;font-size:13px;color:${COLOR_INK};text-align:right;">${shipping > 0 ? formatPrice(shipping) : 'Offerte'}</td>
  </tr>
  <tr>
    <td style="padding:14px 0 0;border-top:1px solid ${COLOR_HAIRLINE};color:${COLOR_INK};font-size:15px;font-family:${FONT_BODY};font-weight:600;">Total</td>
    <td style="padding:14px 0 0;border-top:1px solid ${COLOR_HAIRLINE};font-family:'JetBrains Mono','Courier New',monospace;font-size:15px;color:${COLOR_INK};text-align:right;font-weight:700;">${formatPrice(total)}</td>
  </tr>
</table>"""
    }

    /**
     * Conversion fallback HTML → texte brut pour la version multipart text/plain
     * (clients sans support HTML, et meilleur deliverability anti-spam).
     */
    static String htmlToPlainText(String html) {
        html.replaceAll(/<[^>]+>/, '')
            .replaceAll(/&nbsp;/, ' ')
            .replaceAll(/&amp;/, '&')
            .replaceAll(/&lt;/, '<')
            .replaceAll(/&gt;/, '>')
            .replaceAll(/&quot;/, '"')
            .replaceAll(/\n{3,}/, '\n\n')
            .trim()
    }

    private static String formatPrice(BigDecimal price) {
        if (price == null) return '0,00 €'
        String formatted = price.setScale(2, BigDecimal.ROUND_HALF_UP).toString().replace('.', ',')
        "${formatted} €"
    }

    private static String escape(String s) {
        if (s == null) return ''
        s.replace('&', '&amp;')
         .replace('<', '&lt;')
         .replace('>', '&gt;')
         .replace('"', '&quot;')
    }
}
