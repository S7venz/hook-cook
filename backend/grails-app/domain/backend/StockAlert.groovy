package backend

/**
 * Demande de notification "prévenez-moi quand ce produit revient en stock".
 *
 * Créée par le client sur un produit à stock=0. Consommée par
 * OrderService.updateStock() dès que le stock repasse > 0 : on envoie
 * un email via MailService puis on marque l'alerte comme notifiée
 * (plutôt que de supprimer, pour garder un historique).
 */
class StockAlert {

    User user
    String productId
    Boolean notified = false
    Date notifiedAt
    Date dateCreated

    static constraints = {
        user nullable: false
        productId blank: false, maxSize: 80
        notifiedAt nullable: true
    }

    static mapping = {
        table 'stock_alerts'
        user index: 'stock_alerts_user_idx'
        productId index: 'stock_alerts_product_idx'
    }

    Map toApiMap() {
        [
                id        : id,
                productId : productId,
                notified  : notified,
                notifiedAt: notifiedAt?.toInstant()?.toString(),
                createdAt : dateCreated?.toInstant()?.toString(),
        ]
    }
}
