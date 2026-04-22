package backend

import grails.gorm.transactions.Transactional

@Transactional
class StockAlertService {

    MailService mailService

    Map subscribe(User user, String productId) {
        if (!user) return [error: 'Authentification requise.']
        Product product = Product.get(productId)
        if (!product) return [error: 'Produit introuvable.']
        if ((product.stock ?: 0) > 0) {
            return [error: 'Ce produit est déjà en stock.']
        }

        // Anti-doublon : une alerte active par (user, produit)
        StockAlert existing = StockAlert.findByUserAndProductIdAndNotified(user, productId, false)
        if (existing) return [alert: existing, alreadyPresent: true]

        StockAlert alert = new StockAlert(user: user, productId: productId)
        if (!alert.save(flush: true)) {
            return [error: 'Inscription à l\'alerte impossible.']
        }
        [alert: alert]
    }

    List<StockAlert> forUser(User user) {
        StockAlert.findAllByUser(user, [sort: 'dateCreated', order: 'desc'])
    }

    /**
     * Déclenche l'envoi des emails pour toutes les alertes en attente
     * sur un produit qui vient d'être réapprovisionné. Appelé par
     * ProductController.replenish après save.
     */
    void notifyReplenish(String productId) {
        Product product = Product.get(productId)
        if (!product || (product.stock ?: 0) <= 0) return

        List<StockAlert> pending = StockAlert.findAllByProductIdAndNotified(productId, false)
        if (pending.isEmpty()) return

        pending.each { alert ->
            try {
                sendReplenishEmail(alert, product)
                alert.notified = true
                alert.notifiedAt = new Date()
                alert.save(flush: true)
            } catch (Exception e) {
                log.error('Erreur notification stock alert id={} : {}', alert.id, e.message)
            }
        }
        log.info('Stock alert : {} notifications envoyées pour "{}"', pending.size(), productId)
    }

    private void sendReplenishEmail(StockAlert alert, Product product) {
        mailService?.stockReplenish(alert.user, product)
    }
}
