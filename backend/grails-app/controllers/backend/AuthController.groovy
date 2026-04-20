package backend

import grails.converters.JSON
import grails.gorm.transactions.Transactional

class AuthController {

    static responseFormats = ['json']
    static allowedMethods = [register: 'POST', login: 'POST', me: 'GET', updateMe: 'PATCH']

    AuthService authService

    def register() {
        Map payload = request.JSON as Map
        Map result = authService.register(payload ?: [:])
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        response.status = 201
        render(userPayload(result.user, result.token) as JSON)
    }

    def login() {
        Map payload = request.JSON as Map
        Map result = authService.login(payload ?: [:])
        if (result.error) {
            response.status = 401
            render([error: result.error] as JSON)
            return
        }
        render(userPayload(result.user, result.token) as JSON)
    }

    def me() {
        User user = currentUserFromRequest()
        if (!user) return
        render([user: user.toApiMap()] as JSON)
    }

    @Transactional
    def updateMe() {
        User user = currentUserFromRequest()
        if (!user) return
        Map payload = request.JSON as Map
        ['firstName', 'lastName', 'phone', 'addressLine', 'postalCode', 'city', 'country'].each { field ->
            if (payload.containsKey(field)) user[field] = payload[field]
        }
        if (!user.save(flush: true)) {
            def error = user.errors.allErrors[0]
            response.status = 400
            render([error: error ? "Validation : ${error.field ?: error.code}" : 'Données invalides.'] as JSON)
            return
        }
        render([user: user.toApiMap()] as JSON)
    }

    private User currentUserFromRequest() {
        Map check = authService.userFromRequest(request)
        if (!check.user) {
            response.status = 401
            render([error: check.error ?: 'Authentification requise.'] as JSON)
            return null
        }
        check.user
    }

    private Map userPayload(User user, String token) {
        Map user_data = user.toApiMap()
        if (token) {
            return [user: user_data, token: token]
        }
        [user: user_data]
    }
}
