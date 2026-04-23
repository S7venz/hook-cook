package backend

import grails.converters.JSON

class PermitController {

    static responseFormats = ['json']
    static allowedMethods = [
            current    : 'GET',
            create     : 'POST',
            listAll    : 'GET',
            patchStatus: 'PATCH',
    ]

    AuthService authService
    PermitService permitService

    def current() {
        User user = requireUser()
        if (!user) return
        Permit permit = permitService.currentForUser(user)
        if (!permit) {
            render([permit: null] as JSON)
            return
        }
        render([permit: permit.toApiMap()] as JSON)
    }

    def create() {
        User user = requireUser()
        if (!user) return
        Map payload = request.JSON as Map
        Map result = permitService.create(user, payload ?: [:])
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        response.status = 201
        Map body = [permit: result.permit.toApiMap()]
        if (result.clientSecret) body.clientSecret = result.clientSecret
        if (result.publishableKey) body.publishableKey = result.publishableKey
        render(body as JSON)
    }

    def listAll() {
        if (!requireAdmin()) return
        List<Map> items = permitService.all().collect { p ->
            Map m = p.toApiMap()
            m.userEmail = p.user?.email
            m
        }
        render(items as JSON)
    }

    def patchStatus() {
        if (!requireAdmin()) return
        Map payload = request.JSON as Map
        String status = payload?.status
        Map result = permitService.updateStatus(params.reference, status)
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        render(result.permit.toApiMap() as JSON)
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
