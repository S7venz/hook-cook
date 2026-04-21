package backend

import grails.gorm.transactions.Transactional
import groovy.json.JsonOutput

/**
 * Service RGPD — deux obligations couvertes :
 *
 *   1. Droit d'accès / portabilité (art. 15 + 20 RGPD) :
 *      export complet des données personnelles du user en JSON.
 *
 *   2. Droit à l'effacement (art. 17) :
 *      anonymisation plutôt que hard delete. Les commandes restent
 *      pour obligation fiscale (10 ans) mais sont détachées de
 *      l'identité via un compte "anonyme-<id>" + pseudonymes.
 */
@Transactional
class UserDataService {

    /**
     * Assemble toutes les données rattachées à un utilisateur.
     * Retourne un Map prêt à être sérialisé JSON par le controller.
     */
    Map exportUserData(User user) {
        [
                exportedAt: new Date().toInstant().toString(),
                profile   : [
                        id         : user.id,
                        email      : user.email,
                        firstName  : user.firstName,
                        lastName   : user.lastName,
                        phone      : user.phone,
                        addressLine: user.addressLine,
                        postalCode : user.postalCode,
                        city       : user.city,
                        country    : user.country,
                        role       : user.role,
                        createdAt  : user.dateCreated?.toInstant()?.toString(),
                ],
                orders    : CustomerOrder.findAllByUser(user, [sort: 'dateCreated', order: 'desc'])
                        .collect { it.toApiMap() },
                permits   : Permit.findAllByUser(user, [sort: 'dateCreated', order: 'desc'])
                        .collect { it.toApiMap() },
                contestRegistrations: ContestRegistration.findAllByUser(user, [sort: 'dateCreated', order: 'desc'])
                        .collect { it.toApiMap() },
                carnet    : CatchEntry.findAllByUser(user, [sort: 'catchDate', order: 'desc'])
                        .collect { it.toApiMap() },
                wishlist  : WishlistItem.findAllByUser(user, [sort: 'dateCreated', order: 'desc'])
                        .collect { it.toApiMap() },
                reviews   : ProductReview.findAllByUser(user, [sort: 'dateCreated', order: 'desc'])
                        .collect { it.toApiMap() },
                stockAlerts: StockAlert.findAllByUser(user, [sort: 'dateCreated', order: 'desc'])
                        .collect { it.toApiMap() },
        ]
    }

    String exportUserDataAsJson(User user) {
        JsonOutput.prettyPrint(JsonOutput.toJson(exportUserData(user)))
    }

    /**
     * Anonymise le compte et ses entités non-comptables. Les commandes
     * sont conservées (obligation fiscale 10 ans) mais détachées de
     * l'identité (email remplacé par anonyme-<id>@deleted.local).
     *
     * Retourne un Map avec les décomptes pour audit.
     */
    Map anonymizeUser(User user) {
        if (!user) return [error: 'Utilisateur introuvable.']
        if (user.role == 'ROLE_ADMIN') {
            return [error: 'Impossible de supprimer un compte administrateur.']
        }

        Long userId = user.id

        // 1. Suppression complète des données non critiques
        int wishlistCount = WishlistItem.findAllByUser(user).size()
        WishlistItem.findAllByUser(user)*.delete()

        int alertsCount = StockAlert.findAllByUser(user).size()
        StockAlert.findAllByUser(user)*.delete()

        int carnetCount = CatchEntry.findAllByUser(user).size()
        CatchEntry.findAllByUser(user)*.delete()

        int reviewsCount = ProductReview.findAllByUser(user).size()
        ProductReview.findAllByUser(user)*.delete()

        // 2. Inscriptions concours : supprimées (décrémente le compteur
        //    inscrits sur le contest)
        int contestRegsCount = 0
        ContestRegistration.findAllByUser(user).each { reg ->
            if (reg.contest) {
                reg.contest.inscrits = Math.max(0, (reg.contest.inscrits ?: 1) - 1)
                reg.contest.save(flush: true)
            }
            reg.delete()
            contestRegsCount++
        }

        // 3. Permis : anonymise (garde la référence pour trace fédération
        //    mais vide les infos perso)
        int permitsCount = 0
        Permit.findAllByUser(user).each { p ->
            p.firstName = 'Anonyme'
            p.lastName = "user-${userId}"
            p.birthDate = '0000-00-00'
            p.idDocUrl = null
            p.photoDocUrl = null
            p.save(flush: true)
            permitsCount++
        }

        // 4. Commandes : conservées (obligation 10 ans) mais anonymisées
        // Domaine d'email "anonymise" — on utilise anonymised.hookcook.fr
        // (TLD valide) plutot que .local qui etait rejete silencieusement
        // par le validateur email de Grails, faisant echouer l'anonymisation
        // sans erreur visible.
        String anonEmail = "anonyme-${userId}@anonymised.hookcook.fr"

        int ordersCount = 0
        CustomerOrder.findAllByUser(user).each { o ->
            o.email = anonEmail
            o.addressLine = 'Adresse supprimée (RGPD)'
            o.postalCode = '00000'
            o.city = 'Anonyme'
            o.save(flush: true, failOnError: true)
            ordersCount++
        }

        // 5. User lui-même : email anonymisé, mot de passe neutralisé,
        //    rôle ROLE_USER, prénom/nom/téléphone/adresse vidés.
        user.email = anonEmail
        user.firstName = 'Anonyme'
        user.lastName = "user-${userId}"
        user.phone = null
        user.addressLine = null
        user.postalCode = null
        user.city = null
        user.country = null
        // Hash BCrypt invalide pour empêcher toute reconnexion. Le préfixe
        // $2a$ reste pour ne pas casser les constraints BCrypt attendues.
        user.passwordHash = '$2a$12$' + 'INVALIDATEDBYGDPRDELETIONREQUESTX'
        // failOnError + flush : on veut que le save plante bruyamment
        // plutot que de laisser un user actif en base si une contrainte
        // fail (c'etait le bug : save() silencieux renvoyait null et
        // l'anonymisation n'etait jamais appliquee).
        user.save(flush: true, failOnError: true)

        [
                ok              : true,
                anonymizedAt    : new Date().toInstant().toString(),
                deletions       : [
                        wishlist           : wishlistCount,
                        stockAlerts        : alertsCount,
                        carnet             : carnetCount,
                        reviews            : reviewsCount,
                        contestRegistrations: contestRegsCount,
                ],
                anonymizations  : [
                        permits: permitsCount,
                        orders : ordersCount,
                ],
        ]
    }
}
