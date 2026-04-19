package backend

import grails.converters.JSON

class AuthController {

    static responseFormats = ['json']
    static allowedMethods = [register: 'POST', login: 'POST', me: 'GET']

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
        User user = currentUser()
        if (!user) {
            response.status = 401
            render([error: 'Non authentifié.'] as JSON)
            return
        }
        render(userPayload(user, null) as JSON)
    }

    private Map userPayload(User user, String token) {
        Map user_data = [
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
        ]
        if (token) {
            return [user: user_data, token: token]
        }
        [user: user_data]
    }

    private User currentUser() {
        String header = request.getHeader('Authorization')
        if (!header?.startsWith('Bearer ')) return null
        String token = header.substring('Bearer '.length())
        authService.findByToken(token)
    }
}
