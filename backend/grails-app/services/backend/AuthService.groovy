package backend

import grails.gorm.transactions.Transactional
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder

@Transactional
class AuthService {

    JwtService jwtService

    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder(12)

    static final Set<String> VALID_ROLES = ['ROLE_USER', 'ROLE_ADMIN'] as Set

    Map register(Map command) {
        String email = command.email?.toString()?.trim()?.toLowerCase()
        String password = command.password?.toString()
        String firstName = command.firstName?.toString()?.trim()
        String lastName = command.lastName?.toString()?.trim()

        if (!email || !password || !firstName || !lastName) {
            return [error: 'Tous les champs sont requis.']
        }
        if (!(email ==~ /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)) {
            return [error: 'Email invalide.']
        }
        if (password.length() < 8) {
            return [error: 'Le mot de passe doit faire au moins 8 caractères.']
        }
        if (User.findByEmail(email)) {
            return [error: 'Un compte existe déjà avec cet email.']
        }

        User user = new User(
                email: email,
                passwordHash: ENCODER.encode(password),
                firstName: firstName,
                lastName: lastName,
                role: 'ROLE_USER',
        )
        if (!user.save(flush: true)) {
            return [error: 'Impossible de créer le compte.']
        }

        [user: user, token: jwtService.issue(user)]
    }

    Map login(Map command) {
        String email = command.email?.toString()?.trim()?.toLowerCase()
        String password = command.password?.toString()
        if (!email || !password) {
            return [error: 'Email et mot de passe requis.']
        }

        User user = User.findByEmail(email)
        if (!user || !ENCODER.matches(password, user.passwordHash)) {
            return [error: 'Email ou mot de passe incorrect.']
        }

        [user: user, token: jwtService.issue(user)]
    }

    User findByToken(String token) {
        if (!token) return null
        def claims = jwtService.parse(token)
        if (!claims) return null
        String sub = claims.subject
        if (!sub) return null
        User.get(sub as Long)
    }

    Map userFromRequest(request) {
        String header = request.getHeader('Authorization')
        if (!header || !header.startsWith('Bearer ')) return [error: 'auth_missing']
        String token = header.substring('Bearer '.length())
        def claims = jwtService.parse(token)
        if (!claims) return [error: 'auth_invalid']
        String sub = claims.subject
        if (!sub) return [error: 'auth_invalid']
        User user = User.get(sub as Long)
        if (!user) return [error: 'auth_invalid']
        [user: user, role: claims.get('role')]
    }

    boolean isAdmin(request) {
        Map result = userFromRequest(request)
        result.user && result.user.role == 'ROLE_ADMIN'
    }
}
