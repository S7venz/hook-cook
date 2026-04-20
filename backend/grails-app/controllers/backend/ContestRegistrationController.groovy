package backend

import grails.converters.JSON

class ContestRegistrationController {

    static responseFormats = ['json']
    static allowedMethods = [register: 'POST', myList: 'GET', listAll: 'GET']

    AuthService authService
    ContestRegistrationService contestRegistrationService

    def register() {
        User user = requireUser()
        if (!user) return
        Map payload = request.JSON as Map
        Map result = contestRegistrationService.register(user, params.id, payload ?: [:])
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        response.status = 201
        render(result.registration.toApiMap() as JSON)
    }

    def myList() {
        User user = requireUser()
        if (!user) return
        render(contestRegistrationService.forUser(user).collect { it.toApiMap() } as JSON)
    }

    def listAll() {
        if (!requireAdmin()) return
        List<Map> items = contestRegistrationService.all().collect { r ->
            Map m = r.toApiMap()
            m.userEmail = r.user?.email
            m
        }
        render(items as JSON)
    }

    private User requireUser() {
        Map check = authService.userFromRequest(request)
        if (!check.user) {
            response.status = 401
            render([error: 'Authentification requise.'] as JSON)
            return null
        }
        check.user
    }

    private boolean requireAdmin() {
        if (authService.isAdmin(request)) return true
        response.status = 403
        render([error: 'Accès réservé aux administrateurs.'] as JSON)
        false
    }
}
