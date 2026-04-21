package backend

import grails.gorm.transactions.Transactional

@Transactional
class ReviewService {

    /**
     * Liste publique des avis d'un produit (décroissante par date).
     */
    List<ProductReview> forProduct(String productId) {
        ProductReview.findAllByProductId(productId, [sort: 'dateCreated', order: 'desc'])
    }

    /**
     * Crée un avis si l'utilisateur a commandé ce produit au moins une
     * fois (statut paid/shipped/delivered) et qu'il n'en a pas déjà
     * laissé un.
     */
    Map create(User user, String productId, Map payload) {
        if (!user) return [error: 'Authentification requise.']
        if (!productId || !Product.get(productId)) return [error: 'Produit introuvable.']

        Integer rating = (payload.rating ?: 0) as Integer
        String title = (payload.title ?: '')?.toString()?.trim()
        String comment = (payload.comment ?: '')?.toString()?.trim()

        if (rating < 1 || rating > 5) return [error: 'Note invalide (1 à 5).']
        if (!comment) return [error: 'Le commentaire est requis.']
        if (comment.length() < 10) return [error: 'Commentaire trop court (10 caractères min).']

        if (ProductReview.findByUserAndProductId(user, productId)) {
            return [error: 'Vous avez déjà laissé un avis sur ce produit.']
        }

        boolean bought = hasBought(user, productId)
        if (!bought) {
            return [error: 'Seuls les clients ayant acheté ce produit peuvent laisser un avis.']
        }

        ProductReview review = new ProductReview(
                productId       : productId,
                user            : user,
                rating          : rating,
                title           : title ?: null,
                comment         : comment,
                verifiedPurchase: true,
        )
        if (!review.save(flush: true)) {
            return [error: 'Enregistrement impossible.']
        }

        // Met à jour l'agrégat moyenne + nombre d'avis sur le produit
        updateProductAggregate(productId)
        [review: review]
    }

    Map remove(User user, Long id) {
        ProductReview review = ProductReview.get(id)
        if (!review || (review.user.id != user.id && user.role != 'ROLE_ADMIN')) {
            return [error: 'Avis introuvable.']
        }
        String productId = review.productId
        review.delete(flush: true)
        updateProductAggregate(productId)
        [ok: true]
    }

    /**
     * Vrai si l'utilisateur a au moins une commande payée/expédiée/
     * livrée contenant le produit.
     */
    private boolean hasBought(User user, String productId) {
        def count = OrderItem.createCriteria().count {
            eq('productId', productId)
            order {
                eq('user', user)
                inList('status', ['paid', 'shipped', 'delivered'])
            }
        }
        count > 0
    }

    /**
     * Recalcule rating moyen + nombre d'avis pour un produit et met à
     * jour la ligne Product. Appelé à chaque create/remove d'avis.
     */
    private void updateProductAggregate(String productId) {
        Product product = Product.get(productId)
        if (!product) return
        List<ProductReview> reviews = ProductReview.findAllByProductId(productId)
        if (reviews.isEmpty()) {
            product.rating = null
            product.reviews = 0
        } else {
            BigDecimal avg = reviews.sum { it.rating } / (reviews.size() as BigDecimal)
            product.rating = avg.setScale(1, BigDecimal.ROUND_HALF_UP)
            product.reviews = reviews.size()
        }
        product.save(flush: true)
    }

    /**
     * Vrai si l'utilisateur peut laisser un avis sur ce produit.
     * Exposé à l'UI pour afficher/masquer le formulaire.
     */
    Map eligibility(User user, String productId) {
        if (!user) return [eligible: false, reason: 'not_logged_in']
        if (ProductReview.findByUserAndProductId(user, productId)) {
            return [eligible: false, reason: 'already_reviewed']
        }
        if (!hasBought(user, productId)) {
            return [eligible: false, reason: 'not_purchased']
        }
        [eligible: true]
    }
}
