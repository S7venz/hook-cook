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
        String header = request.getHeader('Authorization')
        log.info('/api/auth/me — Authorization header present: {}', header != null)
        if (!header || !header.startsWith('Bearer ')) {
            response.status = 401
            render([error: 'Token requis.'] as JSON)
            return
        }
        String token = header.substring('Bearer '.length())
        def claims = authService.jwtService.parse(token)
        if (!claims) {
            log.warn('/api/auth/me — JWT invalide')
            response.status = 401
            render([error: 'Token invalide ou expiré.'] as JSON)
            return
        }
        Map user_data = [
                id: claims.getSubject() as Long,
                email: claims.get('email'),
                firstName: claims.get('firstName'),
                lastName: claims.get('lastName'),
                role: claims.get('role'),
        ]
        render([user: user_data] as JSON)
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
}
