package backend

import grails.gorm.transactions.Transactional

@Transactional
class WishlistService {

    List<WishlistItem> forUser(User user) {
        WishlistItem.findAllByUser(user, [sort: 'dateCreated', order: 'desc'])
    }

    Map add(User user, String productId) {
        if (!user) return [error: 'Authentification requise.']
        if (!productId) return [error: 'productId requis.']
        if (!Product.get(productId)) return [error: 'Produit introuvable.']

        WishlistItem existing = WishlistItem.findByUserAndProductId(user, productId)
        if (existing) return [item: existing, alreadyPresent: true]

        WishlistItem item = new WishlistItem(user: user, productId: productId)
        if (!item.save(flush: true)) {
            return [error: 'Ajout impossible.']
        }
        [item: item]
    }

    Map remove(User user, String productId) {
        if (!user) return [error: 'Authentification requise.']
        WishlistItem item = WishlistItem.findByUserAndProductId(user, productId)
        // Idempotent : supprimer un favori déjà retiré renvoie OK.
        if (item) item.delete(flush: true)
        [ok: true]
    }
}
