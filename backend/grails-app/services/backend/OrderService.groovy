package backend

import grails.gorm.transactions.Transactional

@Transactional
class OrderService {

    MailService mailService

    static final Map<String, String> STATUS_LABELS = [
            paid     : 'Payée',
            shipped  : 'Expédiée',
            delivered: 'Livrée',
            cancelled: 'Annulée',
    ]

    private static String generateReference() {
        int rand = (int) (1000 + Math.random() * 8999)
        "HC-2186-${rand}"
    }

    Map createFromCart(User user, Map payload) {
        if (!user) return [error: 'Authentification requise.']
        List cartItems = (payload.items ?: []) as List
        if (!cartItems) return [error: 'Le panier est vide.']

        CustomerOrder order = new CustomerOrder(
                reference   : generateReference(),
                user        : user,
                email       : payload.email?.toString() ?: user.email,
                addressLine : payload.address?.line ?: payload.addressLine,
                postalCode  : payload.address?.postal ?: payload.postalCode,
                city        : payload.address?.city ?: payload.city,
                shippingMode: payload.shippingMode ?: 'Standard Colissimo',
                status      : 'paid',
                statusLabel : STATUS_LABELS.paid,
        )

        BigDecimal subtotal = BigDecimal.ZERO
        cartItems.each { entry ->
            Map itemData = entry as Map
            Map productData = (itemData.product ?: [:]) as Map
            Integer qty = (itemData.qty ?: 1) as Integer
            BigDecimal price = (productData.price ?: 0) as BigDecimal
            subtotal += price * qty
            OrderItem item = new OrderItem(
                    productId      : productData.id as String,
                    productName    : productData.name as String,
                    productSku     : productData.sku as String,
                    productBrand   : productData.brand as String,
                    productImageUrl: productData.imageUrl as String,
                    unitPrice      : price,
                    qty            : qty,
            )
            order.addToItems(item)
        }

        BigDecimal shipping = (payload.shipping ?: 0) as BigDecimal
        order.subtotal = subtotal
        order.shipping = shipping
        order.total = subtotal + shipping

        if (!order.save(flush: true)) {
            return [error: 'Impossible de créer la commande.']
        }
        mailService?.orderConfirmation(order)
        [order: order]
    }

    List<CustomerOrder> ordersForUser(User user) {
        CustomerOrder.findAllByUser(user, [sort: 'dateCreated', order: 'desc'])
    }

    List<CustomerOrder> allOrders() {
        CustomerOrder.list(sort: 'dateCreated', order: 'desc')
    }

    CustomerOrder findByReference(String reference) {
        CustomerOrder.findByReference(reference)
    }

    Map updateStatus(String reference, String status) {
        String label = STATUS_LABELS[status]
        if (!label) return [error: 'Statut invalide.']
        CustomerOrder order = findByReference(reference)
        if (!order) return [error: 'Commande introuvable.']
        order.status = status
        order.statusLabel = label
        if (!order.save(flush: true)) {
            return [error: 'Mise à jour impossible.']
        }
        [order: order]
    }
}
