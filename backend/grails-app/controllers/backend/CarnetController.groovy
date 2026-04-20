package backend

import grails.converters.JSON

class CarnetController {

    static responseFormats = ['json']
    static allowedMethods = [list: 'GET', create: 'POST', remove: 'DELETE']

    AuthService authService
    CarnetService carnetService

    def list() {
        User user = requireUser()
        if (!user) return
        render(carnetService.forUser(user).collect { it.toApiMap() } as JSON)
    }

    def create() {
        User user = requireUser()
        if (!user) return
        Map payload = request.JSON as Map
        Map result = carnetService.create(user, payload ?: [:])
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        response.status = 201
        render(result.entry.toApiMap() as JSON)
    }

    def remove() {
        User user = requireUser()
        if (!user) return
        Map result = carnetService.remove(user, params.id as Long)
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        response.status = 204
        render('')
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
}
