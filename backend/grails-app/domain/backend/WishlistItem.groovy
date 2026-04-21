package backend

/**
 * Favori utilisateur sur un produit.
 *
 * Un utilisateur ne peut favoriter un même produit qu'une seule fois
 * (contrainte d'unicité applicative sur le couple user + productId,
 * vérifiée dans WishlistService avant insert).
 */
class WishlistItem {

    User user
    String productId
    Date dateCreated

    static constraints = {
        user nullable: false
        productId blank: false, maxSize: 80
    }

    static mapping = {
        table 'wishlist_items'
        user index: 'wishlist_user_idx'
        productId index: 'wishlist_product_idx'
    }

    Map toApiMap() {
        [id: id, productId: productId, addedAt: dateCreated?.toInstant()?.toString()]
    }
}
