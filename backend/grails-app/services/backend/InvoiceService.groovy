package backend

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder
import grails.gorm.transactions.Transactional

import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * Génère une facture PDF pour une commande donnée.
 *
 * Approche : on rend du XHTML strict (les tags doivent être fermés),
 * et on le passe à openhtmltopdf-pdfbox qui produit un PDF A4.
 *
 * Le template est inline pour rester simple — pour évoluer on pourra
 * passer sur un .gsp dédié.
 */
@Transactional(readOnly = true)
class InvoiceService {

    private static final DateTimeFormatter FR_DATE = DateTimeFormatter
            .ofPattern('dd/MM/yyyy').withZone(ZoneId.of('Europe/Paris'))

    byte[] renderPdf(CustomerOrder order) {
        if (!order) throw new IllegalArgumentException('Commande manquante')
        String html = buildHtml(order)
        ByteArrayOutputStream out = new ByteArrayOutputStream()
        PdfRendererBuilder builder = new PdfRendererBuilder()
        builder.withHtmlContent(html, null)
        builder.toStream(out)
        builder.run()
        out.toByteArray()
    }

    private String buildHtml(CustomerOrder order) {
        String date = order.dateCreated ?
                FR_DATE.format(order.dateCreated.toInstant()) : ''
        String itemsRows = order.items.collect { item ->
            """
            <tr>
              <td>${esc(item.productName)}<br/>
                <span class="mono">${esc(item.productSku)}</span></td>
              <td class="right">${item.qty}</td>
              <td class="right">${fmt(item.unitPrice)} €</td>
              <td class="right">${fmt(item.unitPrice * item.qty)} €</td>
            </tr>
            """.stripIndent()
        }.join('')

        String customerName = [order.user?.firstName, order.user?.lastName]
                .findAll { it }.join(' ') ?: '—'

        """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <title>Facture ${esc(order.reference)}</title>
  <style>
    @page { size: A4; margin: 20mm 18mm; }
    body {
      font-family: "Helvetica", sans-serif;
      font-size: 10.5pt;
      color: #14233f;
      line-height: 1.5;
    }
    .brand {
      font-family: "Times", serif;
      font-style: italic;
      font-size: 28pt;
      color: #14233f;
      letter-spacing: -1pt;
    }
    .brand small { font-size: 10pt; font-style: normal; color: #5a6478; letter-spacing: 0; }
    .header {
      display: table; width: 100%;
      border-bottom: 1pt solid #14233f;
      padding-bottom: 14pt;
      margin-bottom: 22pt;
    }
    .header > div { display: table-cell; vertical-align: top; }
    .header .right { text-align: right; }
    .eyebrow {
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 1.5pt;
      color: #8a96a8;
      margin-bottom: 4pt;
    }
    h1 { font-size: 18pt; font-weight: normal; margin: 0 0 6pt 0; }
    .meta { font-size: 10pt; color: #3a4558; }
    .mono { font-family: "Courier", monospace; font-size: 9pt; color: #5a6478; }
    .addresses { display: table; width: 100%; margin-bottom: 22pt; }
    .addresses > div { display: table-cell; vertical-align: top; width: 50%; padding-right: 12pt; }
    .addresses h3 { font-size: 9pt; text-transform: uppercase; letter-spacing: 1.5pt; color: #8a96a8; margin: 0 0 6pt 0; }
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 16pt; }
    table.items th {
      text-align: left;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 1pt;
      color: #8a96a8;
      border-bottom: 1pt solid #dcdde5;
      padding: 6pt 4pt;
      font-weight: normal;
    }
    table.items td {
      border-bottom: 1pt solid #eaebef;
      padding: 8pt 4pt;
      vertical-align: top;
    }
    table.items .right { text-align: right; white-space: nowrap; }
    .totals { width: 45%; margin-left: 55%; }
    .totals div { display: table; width: 100%; padding: 4pt 0; }
    .totals div > span { display: table-cell; }
    .totals .label { color: #5a6478; }
    .totals .value { text-align: right; }
    .totals .grand {
      border-top: 1.5pt solid #14233f;
      margin-top: 6pt;
      padding-top: 8pt;
      font-size: 13pt;
    }
    .footer {
      margin-top: 40pt;
      padding-top: 14pt;
      border-top: 1pt solid #dcdde5;
      font-size: 9pt;
      color: #8a96a8;
      text-align: center;
    }
  </style>
</head>
<body>

<div class="header">
  <div>
    <div class="brand">Hook &amp; Cook<br/><small>Perpignan · 66</small></div>
  </div>
  <div class="right">
    <div class="eyebrow">Facture</div>
    <h1>${esc(order.reference)}</h1>
    <div class="meta">Émise le ${date}</div>
  </div>
</div>

<div class="addresses">
  <div>
    <h3>Facturée à</h3>
    <div>${esc(customerName)}</div>
    <div class="mono">${esc(order.email ?: '')}</div>
    <div>${esc(order.addressLine ?: '')}</div>
    <div>${esc(order.postalCode ?: '')} ${esc(order.city ?: '')}</div>
  </div>
  <div>
    <h3>Livraison</h3>
    <div>${esc(order.shippingMode ?: '')}</div>
    <div class="mono">Statut : ${esc(order.statusLabel ?: order.status)}</div>
  </div>
</div>

<table class="items">
  <thead>
    <tr>
      <th>Article</th>
      <th class="right">Qté</th>
      <th class="right">PU TTC</th>
      <th class="right">Total TTC</th>
    </tr>
  </thead>
  <tbody>
    ${itemsRows}
  </tbody>
</table>

<div class="totals">
  <div><span class="label">Sous-total</span><span class="value">${fmt(order.subtotal)} €</span></div>
  <div><span class="label">Livraison</span><span class="value">${fmt(order.shipping)} €</span></div>
  <div class="grand"><span class="label">Total TTC</span><span class="value">${fmt(order.total)} €</span></div>
</div>

<div class="footer">
  Hook &amp; Cook · Articles de pêche · Perpignan (66) · contact@hookcook.fr<br/>
  TVA non applicable — art. 293 B du CGI. Merci pour votre confiance.
</div>

</body>
</html>
"""
    }

    private String fmt(BigDecimal n) {
        if (n == null) return '0,00'
        n.setScale(2, BigDecimal.ROUND_HALF_UP).toString().replace('.', ',')
    }

    private String esc(String s) {
        if (s == null) return ''
        s.replace('&', '&amp;')
         .replace('<', '&lt;')
         .replace('>', '&gt;')
         .replace('"', '&quot;')
         .replace("'", '&#39;')
    }
}
