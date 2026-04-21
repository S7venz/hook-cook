package backend

import grails.converters.JSON

class PasswordResetController {

    static responseFormats = ['json']
    static allowedMethods = [request: 'POST', confirm: 'POST']

    PasswordResetService passwordResetService

    /**
     * POST /api/auth/password-reset/request  { email }
     *
     * Renvoie TOUJOURS 200 OK avec message générique pour ne pas
     * leaker l'existence d'un compte (anti-énumération).
     */
    def request() {
        Map payload = this.request.JSON as Map
        String email = payload?.email
        // L'URL de base frontend sert à construire le lien dans l'email.
        // On la déduit de l'Origin / Referer ou fallback dev.
        String baseUrl = resolveBaseUrl()
        passwordResetService.requestReset(email, baseUrl)
        render([
                ok     : true,
                message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
        ] as JSON)
    }

    /**
     * POST /api/auth/password-reset/confirm  { token, password }
     */
    def confirm() {
        Map payload = this.request.JSON as Map
        Map result = passwordResetService.confirmReset(payload?.token, payload?.password)
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        render(result as JSON)
    }

    private String resolveBaseUrl() {
        String origin = this.request.getHeader('Origin')
        if (origin) return origin.replaceAll('/$', '')
        String referer = this.request.getHeader('Referer')
        if (referer) {
            // Garde scheme+host+port
            return referer.replaceFirst(/^(https?:\/\/[^\/]+).*/, '$1')
        }
        'http://localhost:5173'
    }
}
