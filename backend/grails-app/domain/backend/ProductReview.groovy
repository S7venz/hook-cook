package backend

/**
 * Avis client sur un produit.
 *
 * Règles métier :
 *   - Un utilisateur ne peut laisser qu'un seul avis par produit
 *     (unique sur le couple user + productId).
 *   - Seuls les utilisateurs ayant commandé ET reçu le produit
 *     peuvent laisser un avis → géré dans ReviewService, pas ici.
 *   - Les champs rating et comment sont obligatoires ; le titre
 *     est optionnel.
 *   - verifiedPurchase est mis à true si on a pu confirmer la
 *     commande au moment de la création.
 */
class ProductReview {

    String productId          // slug du produit (ex "hc-sauvage-9-5")
    User user
    Integer rating            // 1..5
    String title              // titre court (optionnel)
    String comment            // texte libre
    Boolean verifiedPurchase = true

    Date dateCreated
    Date lastUpdated

    static constraints = {
        productId blank: false, maxSize: 80
        user nullable: false
        rating min: 1, max: 5
        title nullable: true, maxSize: 120
        comment blank: false, maxSize: 2000
    }

    static mapping = {
        table 'product_reviews'
        productId index: 'product_reviews_product_idx'
        user index: 'product_reviews_user_idx'
        comment type: 'text'
    }

    Map toApiMap() {
        [
                id             : id,
                productId      : productId,
                rating         : rating,
                title          : title,
                comment        : comment,
                verifiedPurchase: verifiedPurchase,
                author         : user ? [
                        firstName: user.firstName,
                        lastName : (user.lastName ? user.lastName[0] + '.' : ''),
                ] : null,
                createdAt      : dateCreated?.toInstant()?.toString(),
        ]
    }
}
