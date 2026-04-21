package backend

/**
 * Jeton de réinitialisation de mot de passe.
 *
 * Principe :
 *   - Le user clique sur "Mot de passe oublié", saisit son email.
 *   - Un token aléatoire (UUID complet, 128 bits d'entropie) est créé
 *     avec expiration à +1h.
 *   - Un email contenant le lien /reset-password/:token est envoyé.
 *   - Le user ouvre le lien, saisit son nouveau mot de passe.
 *   - Le token est marqué comme utilisé (one-shot), le password hash
 *     du user est mis à jour.
 *
 * On ne divulgue pas si l'email existe : la requête initiale renvoie
 * toujours 200 OK avec un message générique (anti-énumération).
 */
class PasswordResetToken {

    User user
    String token             // UUID, indexé unique
    Date expiresAt
    Boolean used = false
    Date usedAt

    Date dateCreated

    static constraints = {
        user nullable: false
        token blank: false, unique: true, maxSize: 64
        expiresAt nullable: false
        usedAt nullable: true
    }

    static mapping = {
        table 'password_reset_tokens'
        token index: 'pwd_reset_token_idx'
        user index: 'pwd_reset_user_idx'
    }

    boolean isValid() {
        !used && expiresAt?.after(new Date())
    }
}
