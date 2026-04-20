package backend

import grails.converters.JSON

class StatsController {

    static responseFormats = ['json']
    static allowedMethods = [overview: 'GET']

    AuthService authService
    StatsService statsService

    def overview() {
        if (!authService.isAdmin(request)) {
            response.status = 403
            render([error: 'Accès réservé aux administrateurs.'] as JSON)
            return
        }
        render(statsService.buildStats() as JSON)
    }
}
