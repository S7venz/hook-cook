package backend

import grails.converters.JSON

import java.time.LocalDate

class ExportController {

    static responseFormats = ['json']
    static allowedMethods = [orders: 'GET', permits: 'GET', contestRegistrations: 'GET']

    AuthService authService
    ExportService exportService

    def orders() {
        if (!requireAdmin()) return
        serveCsv('commandes', exportService.ordersCsv())
    }

    def permits() {
        if (!requireAdmin()) return
        serveCsv('permis', exportService.permitsCsv())
    }

    def contestRegistrations() {
        if (!requireAdmin()) return
        serveCsv('inscriptions-concours', exportService.contestRegistrationsCsv())
    }

    private void serveCsv(String slug, String content) {
        String filename = "hook-cook-${slug}-${LocalDate.now()}.csv"
        response.contentType = 'text/csv; charset=UTF-8'
        response.setHeader('Content-Disposition', "attachment; filename=\"${filename}\"")
        response.outputStream.withStream { out ->
            out.write(content.getBytes('UTF-8'))
            out.flush()
        }
    }

    private boolean requireAdmin() {
        if (authService.isAdmin(request)) return true
        response.status = 403
        render([error: 'Accès réservé aux administrateurs.'] as JSON)
        false
    }
}
