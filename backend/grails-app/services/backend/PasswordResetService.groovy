package backend

import grails.gorm.transactions.Transactional
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder

import java.time.Instant
import java.time.temporal.ChronoUnit

@Transactional
class PasswordResetService {

    MailService mailService
    RateLimitService rateLimitService

    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder(12)
    private static final int TOKEN_TTL_HOURS = 1

    // 3 demandes / heure par email — évite qu'un attaquant spam les
    // boîtes mail d'utilisateurs réels ou utilise le flow en DoS.
    private static final int REQUEST_MAX = 3
    private static final long REQUEST_WINDOW_MS = 60L * 60 * 1000

    /**
     * Crée un token et envoie l'email SI l'utilisateur existe.
     * Dans tous les cas, renvoie un résultat identique pour ne pas
     * leaker l'existence d'un compte.
     */
    Map requestReset(String email, String baseUrl) {
        String normalized = email?.trim()?.toLowerCase()
        if (!normalized) return [ok: true]

        // Rate limit par email pour éviter le spam
        if (!rateLimitService.allow("pwd-reset:${normalized}", REQUEST_MAX, REQUEST_WINDOW_MS)) {
            // On renvoie toujours OK pour ne pas révéler qu'un email
            // existe. Le rate limit protège silencieusement.
            return [ok: true]
        }

        User user = User.findByEmail(normalized)
        if (!user) {
            // Email inconnu → on ne fait rien mais on renvoie OK.
            // Délai artificiel pour que le temps de réponse soit
            // comparable au cas où l'email existe (timing-safe).
            Thread.sleep(150)
            return [ok: true]
        }

        // Invalide les tokens précédents de ce user (un seul actif à la fois)
        PasswordResetToken.findAllByUserAndUsed(user, false).each {
            it.used = true
            it.usedAt = new Date()
            it.save(flush: true)
        }

        String tokenValue = UUID.randomUUID().toString()
        Date expires = Date.from(Instant.now().plus(TOKEN_TTL_HOURS, ChronoUnit.HOURS))
        PasswordResetToken token = new PasswordResetToken(
                user: user, token: tokenValue, expiresAt: expires, used: false,
        )
        if (!token.save(flush: true)) {
            return [ok: true] // on cache l'erreur aussi
        }

        sendResetEmail(user, tokenValue, baseUrl)
        [ok: true]
    }

    /**
     * Valide un token et, si OK, met à jour le password du user.
     * Retourne des erreurs explicites cette fois — l'attaquant a déjà
     * soit l'email soit le token, pas d'info supplémentaire à leaker.
     */
    Map confirmReset(String tokenValue, String newPassword) {
        if (!tokenValue) return [error: 'Token manquant.']
        if (!newPassword || newPassword.length() < 8) {
            return [error: 'Le mot de passe doit faire au moins 8 caractères.']
        }

        PasswordResetToken token = PasswordResetToken.findByToken(tokenValue)
        if (!token) return [error: 'Token invalide.']
        if (!token.isValid()) return [error: 'Token expiré ou déjà utilisé.']

        User user = token.user
        if (!user) return [error: 'Compte introuvable.']

        user.passwordHash = ENCODER.encode(newPassword)
        user.save(flush: true)

        token.used = true
        token.usedAt = new Date()
        token.save(flush: true)

        [ok: true, email: user.email]
    }

    private void sendResetEmail(User user, String token, String baseUrl) {
        String url = "${baseUrl}/reset-password/${token}"
        String body = """Bonjour ${user.firstName ?: ''},

Vous avez demandé à réinitialiser votre mot de passe Hook & Cook.

Ouvrez ce lien dans votre navigateur pour choisir un nouveau mot de passe :
${url}

Ce lien est valable 1 heure. Si vous n'êtes pas à l'origine de cette
demande, ignorez simplement cet email — votre mot de passe actuel
reste inchangé.

— L'équipe Hook & Cook
"""
        mailService?.send(user.email, 'Réinitialisation de votre mot de passe', body)
    }
}
