package backend

import grails.converters.JSON

/**
 * Endpoints utilitaires pour l'admin (QA / debug).
 */
class AdminTestController {

    static responseFormats = ['json']
    static allowedMethods = [sendSampleEmail: 'POST']

    AuthService authService
    MailService mailService

    /**
     * Envoie un email de démo à une adresse pour vérifier le rendu HTML.
     * Body: { "to": "test@example.com", "template": "order|permit|contest" }
     */
    def sendSampleEmail() {
        if (!authService.isAdmin(request)) {
            response.status = 403
            render([error: 'Accès réservé aux administrateurs.'] as JSON)
            return
        }
        Map payload = request.JSON as Map
        String to = payload?.to?.toString()?.trim()
        String template = (payload?.template?.toString()?.trim() ?: 'order').toLowerCase()
        if (!to) {
            response.status = 400
            render([error: 'Champ "to" requis.'] as JSON)
            return
        }
        try {
            mailService.sendSample(to, template)
            render([sent: true, to: to, template: template] as JSON)
        } catch (IllegalArgumentException e) {
            response.status = 400
            render([error: e.message] as JSON)
        } catch (Exception e) {
            log.error('Sample email failed: {}', e.message)
            response.status = 500
            render([error: e.message] as JSON)
        }
    }
}
