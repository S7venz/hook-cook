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
        // UUID tronqué (8 hex chars → ~4B valeurs) + SecureRandom plutôt
        // que Math.random() (PRNG non-crypto prédictible). Évite les
        // collisions à partir de la 105ᵉ commande et la devinabilité.
        String suffix = UUID.randomUUID().toString().replace('-', '').take(8).toUpperCase()
        "HC-2186-${suffix}"
    }

    Map createFromCart(User user, Map payload) {
        if (!user) return [error: 'Authentification requise.']
        List cartItems = (payload.items ?: []) as List
        if (!cartItems) return [error: 'Le panier est vide.']

        // Agrège les quantités par produit (un même id peut apparaître
        // plusieurs fois si le panier contient des variantes), puis vérifie
        // le stock avant toute écriture pour garantir l'atomicité métier.
        Map<String, Integer> qtyByProduct = [:]
        cartItems.each { entry ->
            Map itemData = entry as Map
            Map productData = (itemData.product ?: [:]) as Map
            String pid = productData.id as String
            Integer qty = (itemData.qty ?: 1) as Integer
            if (pid) qtyByProduct[pid] = (qtyByProduct[pid] ?: 0) + qty
        }

        Map<String, Product> productsById = [:]
        for (Map.Entry<String, Integer> e : qtyByProduct.entrySet()) {
            Product p = Product.get(e.key)
            if (!p) {
                return [error: "Produit introuvable : ${e.key}".toString()]
            }
            if ((p.stock ?: 0) < e.value) {
                return [error: "Stock insuffisant pour « ${p.name} » (disponible : ${p.stock ?: 0}, demandé : ${e.value}).".toString()]
            }
            productsById[e.key] = p
        }

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

        qtyByProduct.each { pid, qty ->
            Product p = productsById[pid]
            p.stock = (p.stock ?: 0) - qty
            p.save(flush: true)
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
