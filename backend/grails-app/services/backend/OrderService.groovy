package backend

import grails.gorm.transactions.Transactional

@Transactional
class OrderService {

    MailService mailService
    StripeService stripeService

    static final Map<String, String> STATUS_LABELS = [
            pending       : 'En attente de paiement',
            paid          : 'Payée',
            payment_failed: 'Paiement échoué',
            shipped       : 'Expédiée',
            delivered     : 'Livrée',
            cancelled     : 'Annulée',
    ]

    private static String generateReference() {
        // UUID tronqué (8 hex chars → ~4B valeurs) + SecureRandom plutôt
        // que Math.random() (PRNG non-crypto prédictible). Évite les
        // collisions à partir de la 105ᵉ commande et la devinabilité.
        String suffix = UUID.randomUUID().toString().replace('-', '').take(8).toUpperCase()
        "HC-2186-${suffix}"
    }

    /**
     * Crée une commande à partir du panier.
     *
     * Flux Stripe (clé configurée) :
     *   1. vérifie le stock (sans décrémenter)
     *   2. crée la CustomerOrder en status `pending`
     *   3. crée un PaymentIntent Stripe et stocke son id
     *   4. retourne `{order, clientSecret, publishableKey}` au frontend
     *   5. la décrémentation du stock + mail de confirmation se font dans
     *      le webhook `payment_intent.succeeded` (markPaidByPaymentIntent)
     *
     * Flux mock (pas de clé Stripe — CI / démo) :
     *   commande directement en `paid`, stock décrémenté, mail envoyé.
     */
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

        boolean stripeOn = stripeService?.isConfigured()
        String initialStatus = stripeOn ? 'pending' : 'paid'

        CustomerOrder order = new CustomerOrder(
                reference   : generateReference(),
                user        : user,
                email       : payload.email?.toString() ?: user.email,
                addressLine : payload.address?.line ?: payload.addressLine,
                postalCode  : payload.address?.postal ?: payload.postalCode,
                city        : payload.address?.city ?: payload.city,
                shippingMode: payload.shippingMode ?: 'Standard Colissimo',
                status      : initialStatus,
                statusLabel : STATUS_LABELS[initialStatus],
        )

        BigDecimal subtotal = BigDecimal.ZERO
        cartItems.each { entry ->
            Map itemData = entry as Map
            Map productData = (itemData.product ?: [:]) as Map
            Integer qty = (itemData.qty ?: 1) as Integer
            // Prix tarifé côté serveur (jamais confiance au montant envoyé par le front)
            Product p = productsById[productData.id as String]
            BigDecimal price = p?.price ?: 0G
            subtotal += price * qty
            OrderItem item = new OrderItem(
                    productId      : productData.id as String,
                    productName    : p?.name ?: productData.name as String,
                    productSku     : p?.sku ?: productData.sku as String,
                    productBrand   : p?.brand ?: productData.brand as String,
                    productImageUrl: p?.imageUrl ?: productData.imageUrl as String,
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

        if (stripeOn) {
            try {
                Map intent = stripeService.createPaymentIntent(
                        order.total,
                        [orderReference: order.reference, userId: user.id?.toString()],
                )
                order.stripePaymentIntentId = intent.paymentIntentId as String
                order.save(flush: true)
                return [
                        order          : order,
                        clientSecret   : intent.clientSecret,
                        publishableKey : stripeService.publishableKey,
                ]
            } catch (Exception e) {
                log.error('Échec création PaymentIntent Stripe pour {} : {}', order.reference, e.message)
                order.status = 'payment_failed'
                order.statusLabel = STATUS_LABELS.payment_failed
                order.save(flush: true)
                return [error: 'Impossible d\'initialiser le paiement.']
            }
        }

        // Mode mock : décrémente immédiatement et envoie la confirmation
        decrementStock(qtyByProduct, productsById)
        mailService?.orderConfirmation(order)
        [order: order, mockPayment: true]
    }

    /**
     * Marque une commande payée suite à un webhook payment_intent.succeeded.
     * Idempotent : ré-appel sur une commande déjà `paid` ne fait rien.
     */
    Map markPaidByPaymentIntent(String paymentIntentId) {
        if (!paymentIntentId) return [error: 'paymentIntentId requis.']
        CustomerOrder order = CustomerOrder.findByStripePaymentIntentId(paymentIntentId)
        if (!order) return [error: 'Commande introuvable pour ce PaymentIntent.']
        if (order.status == 'paid' || order.status == 'shipped' || order.status == 'delivered') {
            return [order: order, alreadyProcessed: true]
        }

        order.status = 'paid'
        order.statusLabel = STATUS_LABELS.paid
        if (!order.save(flush: true)) {
            return [error: 'Mise à jour impossible.']
        }

        // Décrémentation du stock APRÈS confirmation paiement
        Map<String, Integer> qtyByProduct = [:]
        order.items?.each { OrderItem it ->
            qtyByProduct[it.productId] = (qtyByProduct[it.productId] ?: 0) + (it.qty ?: 0)
        }
        Map<String, Product> productsById = [:]
        qtyByProduct.keySet().each { pid -> productsById[pid] = Product.get(pid) }
        decrementStock(qtyByProduct, productsById)

        mailService?.orderConfirmation(order)
        [order: order]
    }

    /**
     * Synchronise le statut d'une commande avec Stripe en interrogeant
     * directement l'API. Fallback utile quand le webhook n'arrive pas
     * (dev local sans `stripe listen`). Idempotent.
     */
    Map syncFromStripe(String orderReference) {
        if (!stripeService?.isConfigured()) {
            return [error: 'Stripe non configuré.']
        }
        CustomerOrder order = findByReference(orderReference)
        if (!order) return [error: 'Commande introuvable.']
        if (order.status in ['paid', 'shipped', 'delivered']) {
            return [order: order, alreadyProcessed: true]
        }
        if (!order.stripePaymentIntentId) {
            return [error: 'Aucun PaymentIntent associé à cette commande.']
        }

        def pi = stripeService.retrievePaymentIntent(order.stripePaymentIntentId)
        if (!pi) return [error: 'PaymentIntent introuvable côté Stripe.']

        switch (pi.status) {
            case 'succeeded':
                return markPaidByPaymentIntent(order.stripePaymentIntentId)
            case 'canceled':
            case 'requires_payment_method':
                if (order.status == 'pending') {
                    // L'utilisateur a abandonné ou le paiement a été refusé sans webhook
                    return [order: order, stripeStatus: pi.status]
                }
                return markFailedByPaymentIntent(order.stripePaymentIntentId)
            default:
                // requires_action, processing, requires_confirmation : on attend encore
                return [order: order, stripeStatus: pi.status, pending: true]
        }
    }

    Map markFailedByPaymentIntent(String paymentIntentId) {
        if (!paymentIntentId) return [error: 'paymentIntentId requis.']
        CustomerOrder order = CustomerOrder.findByStripePaymentIntentId(paymentIntentId)
        if (!order) return [error: 'Commande introuvable.']
        if (order.status == 'paid') return [order: order, alreadyProcessed: true]
        order.status = 'payment_failed'
        order.statusLabel = STATUS_LABELS.payment_failed
        order.save(flush: true)
        [order: order]
    }

    private void decrementStock(Map<String, Integer> qtyByProduct, Map<String, Product> productsById) {
        qtyByProduct.each { String pid, Integer qty ->
            Product p = productsById[pid]
            if (p == null) return
            p.stock = (p.stock ?: 0) - qty
            p.save(flush: true)
        }
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
        // Statuts admin uniquement — exclut pending/payment_failed (gérés par webhooks)
        Set<String> adminAllowed = ['paid', 'shipped', 'delivered', 'cancelled'] as Set
        if (!adminAllowed.contains(status)) return [error: 'Statut invalide.']
        String label = STATUS_LABELS[status]
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
