package backend

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import spock.lang.Specification

class OrderServiceSpec extends Specification implements ServiceUnitTest<OrderService>, DataTest {

    void setupSpec() {
        mockDomains User, CustomerOrder, OrderItem, Product
    }

    def setup() {
        // Par défaut on simule "Stripe non configuré" → mode mock
        // (paiement immédiat). Les tests Stripe-on overridenront isConfigured().
        service.stripeService = Mock(StripeService) {
            isConfigured() >> false
        }
    }

    User buildUser() {
        new User(
                email: 'alice@test.fr',
                passwordHash: 'x',
                firstName: 'Alice',
                lastName: 'Martin',
        ).save(failOnError: true, validate: false)
    }

    Product buildProduct(String id, String name = 'Produit', BigDecimal price = 10, int stock = 100) {
        Product p = new Product(
                sku     : "SKU-${id}",
                name    : name,
                category: 'cannes',
                price   : price,
                stock   : stock,
        )
        p.id = id
        p.save(failOnError: true, validate: false)
    }

    void "createFromCart rejects empty cart"() {
        given:
        User u = buildUser()

        when:
        Map result = service.createFromCart(u, [items: []])

        then:
        result.error == 'Le panier est vide.'
    }

    void "createFromCart requires an authenticated user"() {
        when:
        Map result = service.createFromCart(null, [items: [[qty: 1]]])

        then:
        result.error == 'Authentification requise.'
    }

    void "createFromCart en mode mock crée une commande directement payée"() {
        given:
        User u = buildUser()
        buildProduct('hc-x', 'Canne X', 50.0, 10)
        buildProduct('hc-y', 'Leurre Y', 20.0, 10)

        when:
        Map result = service.createFromCart(u, [
                items       : [
                        [qty: 2, product: [id: 'hc-x']],
                        [qty: 1, product: [id: 'hc-y']],
                ],
                email       : 'alice@test.fr',
                shipping    : 5.9,
                addressLine : '1 rue du Lac',
                postalCode  : '66000',
                city        : 'Perpignan',
                shippingMode: 'Standard Colissimo',
        ])

        then:
        !result.error
        result.mockPayment == true
        result.order.subtotal == 120.0
        result.order.shipping == 5.9
        result.order.total == 125.9
        result.order.status == 'paid'
        result.order.items.size() == 2
        result.order.items.find { it.productId == 'hc-x' }.qty == 2
    }

    void "createFromCart en mode mock décrémente le stock immédiatement"() {
        given:
        User u = buildUser()
        buildProduct('hc-x', 'Canne X', 50.0, 10)
        buildProduct('hc-y', 'Leurre Y', 20.0, 5)

        when:
        Map result = service.createFromCart(u, [
                items       : [
                        [qty: 3, product: [id: 'hc-x']],
                        [qty: 2, product: [id: 'hc-y']],
                ],
                email       : u.email,
                addressLine : '1 rue', postalCode: '66000', city: 'Perpignan', shippingMode: 'Colissimo',
        ])

        then:
        !result.error
        Product.get('hc-x').stock == 7
        Product.get('hc-y').stock == 3
    }

    void "createFromCart agrège les quantités d'un même produit avant de vérifier le stock"() {
        given:
        User u = buildUser()
        buildProduct('hc-x', 'Canne X', 50.0, 5)

        when:
        Map result = service.createFromCart(u, [
                items       : [
                        [qty: 3, product: [id: 'hc-x']],
                        [qty: 2, product: [id: 'hc-x']],
                ],
                email       : u.email,
                addressLine : '1 rue', postalCode: '66000', city: 'Perpignan', shippingMode: 'Colissimo',
        ])

        then:
        !result.error
        Product.get('hc-x').stock == 0
    }

    void "createFromCart rejette si le stock est insuffisant et ne décrémente rien"() {
        given:
        User u = buildUser()
        buildProduct('hc-x', 'Canne X', 50.0, 2)

        when:
        Map result = service.createFromCart(u, [
                items       : [[qty: 5, product: [id: 'hc-x']]],
                email       : u.email,
                addressLine : '1 rue', postalCode: '66000', city: 'Perpignan', shippingMode: 'Colissimo',
        ])

        then:
        result.error?.startsWith('Stock insuffisant')
        Product.get('hc-x').stock == 2
        CustomerOrder.count() == 0
    }

    void "createFromCart rejette si un produit est introuvable"() {
        given:
        User u = buildUser()

        when:
        Map result = service.createFromCart(u, [
                items       : [[qty: 1, product: [id: 'inconnu']]],
                email       : u.email,
                addressLine : '1 rue', postalCode: '66000', city: 'Perpignan', shippingMode: 'Colissimo',
        ])

        then:
        result.error?.startsWith('Produit introuvable')
        CustomerOrder.count() == 0
    }

    void "createFromCart en mode Stripe crée la commande pending et NE décrémente PAS le stock"() {
        given:
        User u = buildUser()
        buildProduct('hc-x', 'Canne X', 50.0, 10)
        StripeService stripe = Mock(StripeService) {
            isConfigured() >> true
            getPublishableKey() >> 'pk_test_xxx'
            createPaymentIntent(_, _) >> [
                    paymentIntentId: 'pi_test_123',
                    clientSecret   : 'pi_test_123_secret_abc',
                    amount         : 10000L,
                    currency       : 'eur',
                    status         : 'requires_payment_method',
            ]
        }
        service.stripeService = stripe

        when:
        Map result = service.createFromCart(u, [
                items       : [[qty: 2, product: [id: 'hc-x']]],
                email       : u.email,
                addressLine : '1 rue', postalCode: '66000', city: 'Perpignan', shippingMode: 'Colissimo',
        ])

        then:
        !result.error
        result.clientSecret == 'pi_test_123_secret_abc'
        result.publishableKey == 'pk_test_xxx'
        result.order.status == 'pending'
        result.order.statusLabel == 'En attente'
        result.order.stripePaymentIntentId == 'pi_test_123'
        // CRITIQUE : le stock n'est PAS décrémenté tant que le webhook n'a pas confirmé
        Product.get('hc-x').stock == 10
    }

    void "createFromCart en mode Stripe marque la commande payment_failed si l'API Stripe échoue"() {
        given:
        User u = buildUser()
        buildProduct('hc-x', 'Canne X', 50.0, 10)
        service.stripeService = Mock(StripeService) {
            isConfigured() >> true
            createPaymentIntent(_, _) >> { throw new RuntimeException('Stripe API down') }
        }

        when:
        Map result = service.createFromCart(u, [
                items       : [[qty: 1, product: [id: 'hc-x']]],
                email       : u.email,
                addressLine : '1 rue', postalCode: '66000', city: 'Perpignan', shippingMode: 'Colissimo',
        ])

        then:
        result.error == 'Impossible d\'initialiser le paiement.'
        // La commande existe mais en payment_failed, le stock reste intact
        CustomerOrder.count() == 1
        CustomerOrder.first().status == 'payment_failed'
        Product.get('hc-x').stock == 10
    }

    void "markPaidByPaymentIntent marque payée et décrémente le stock"() {
        given:
        User u = buildUser()
        buildProduct('hc-x', 'Canne X', 50.0, 10)
        service.stripeService = Mock(StripeService) {
            isConfigured() >> true
            getPublishableKey() >> 'pk_test_xxx'
            createPaymentIntent(_, _) >> [paymentIntentId: 'pi_abc', clientSecret: 'cs']
        }
        Map created = service.createFromCart(u, [
                items       : [[qty: 3, product: [id: 'hc-x']]],
                email       : u.email,
                addressLine : '1 rue', postalCode: '66000', city: 'Perpignan', shippingMode: 'Colissimo',
        ])
        assert created.order.status == 'pending'
        assert Product.get('hc-x').stock == 10

        when:
        Map result = service.markPaidByPaymentIntent('pi_abc')

        then:
        !result.error
        result.order.status == 'paid'
        result.order.statusLabel == 'Payée'
        Product.get('hc-x').stock == 7
    }

    void "markPaidByPaymentIntent est idempotent — un second appel ne re-décrémente pas"() {
        given:
        User u = buildUser()
        buildProduct('hc-x', 'Canne X', 50.0, 10)
        service.stripeService = Mock(StripeService) {
            isConfigured() >> true
            createPaymentIntent(_, _) >> [paymentIntentId: 'pi_idem', clientSecret: 'cs']
        }
        service.createFromCart(u, [
                items       : [[qty: 2, product: [id: 'hc-x']]],
                email       : u.email,
                addressLine : '1 rue', postalCode: '66000', city: 'Perpignan', shippingMode: 'Colissimo',
        ])

        when:
        Map first = service.markPaidByPaymentIntent('pi_idem')
        Map second = service.markPaidByPaymentIntent('pi_idem')

        then:
        !first.error
        !second.error
        second.alreadyProcessed == true
        Product.get('hc-x').stock == 8 // décrémenté une seule fois
    }

    void "markPaidByPaymentIntent renvoie une erreur si le PaymentIntent est inconnu"() {
        when:
        Map result = service.markPaidByPaymentIntent('pi_inconnu')

        then:
        result.error == 'Commande introuvable pour ce PaymentIntent.'
    }

    void "syncFromStripe bascule la commande paid si le PaymentIntent Stripe est succeeded"() {
        given:
        User u = buildUser()
        buildProduct('hc-x', 'Canne X', 50.0, 10)
        // Stripe configuré + retour PI succeeded au moment du sync
        def piSucceeded = [id: 'pi_sync_ok', status: 'succeeded'] as Object
        StripeService stripe = Mock(StripeService) {
            isConfigured() >> true
            createPaymentIntent(_, _) >> [paymentIntentId: 'pi_sync_ok', clientSecret: 'cs']
            retrievePaymentIntent('pi_sync_ok') >> piSucceeded
        }
        service.stripeService = stripe
        service.createFromCart(u, [
                items       : [[qty: 2, product: [id: 'hc-x']]],
                email       : u.email,
                addressLine : '1 rue', postalCode: '66000', city: 'Perpignan', shippingMode: 'Colissimo',
        ])

        when:
        Map result = service.syncFromStripe(CustomerOrder.first().reference)

        then:
        !result.error
        result.order.status == 'paid'
        Product.get('hc-x').stock == 8
    }

    void "syncFromStripe est no-op si la commande est déjà paid"() {
        given:
        User u = buildUser()
        buildProduct('hc-x', 'Canne X', 50.0, 10)
        StripeService stripe = Mock(StripeService) {
            isConfigured() >> true
            createPaymentIntent(_, _) >> [paymentIntentId: 'pi_done', clientSecret: 'cs']
        }
        service.stripeService = stripe
        service.createFromCart(u, [
                items       : [[qty: 1, product: [id: 'hc-x']]],
                email       : u.email,
                addressLine : '1 rue', postalCode: '66000', city: 'Perpignan', shippingMode: 'Colissimo',
        ])
        service.markPaidByPaymentIntent('pi_done')

        when:
        Map result = service.syncFromStripe(CustomerOrder.first().reference)

        then:
        // retrievePaymentIntent ne doit JAMAIS être appelé sur une commande déjà payée
        0 * stripe.retrievePaymentIntent(_)
        result.alreadyProcessed == true
        Product.get('hc-x').stock == 9 // décrémenté une fois, pas deux
    }

    void "syncFromStripe renvoie pending: true si le paiement Stripe est encore en cours"() {
        given:
        User u = buildUser()
        buildProduct('hc-x', 'Canne X', 50.0, 10)
        def piProcessing = [id: 'pi_proc', status: 'processing'] as Object
        service.stripeService = Mock(StripeService) {
            isConfigured() >> true
            createPaymentIntent(_, _) >> [paymentIntentId: 'pi_proc', clientSecret: 'cs']
            retrievePaymentIntent('pi_proc') >> piProcessing
        }
        service.createFromCart(u, [
                items       : [[qty: 1, product: [id: 'hc-x']]],
                email       : u.email,
                addressLine : '1 rue', postalCode: '66000', city: 'Perpignan', shippingMode: 'Colissimo',
        ])

        when:
        Map result = service.syncFromStripe(CustomerOrder.first().reference)

        then:
        !result.error
        result.pending == true
        result.stripeStatus == 'processing'
        result.order.status == 'pending'
        Product.get('hc-x').stock == 10
    }

    void "syncFromStripe refuse si Stripe n'est pas configuré"() {
        given:
        service.stripeService = Mock(StripeService) { isConfigured() >> false }

        when:
        Map result = service.syncFromStripe('HC-X')

        then:
        result.error == 'Stripe non configuré.'
    }

    void "markFailedByPaymentIntent marque la commande payment_failed sans toucher au stock"() {
        given:
        User u = buildUser()
        buildProduct('hc-x', 'Canne X', 50.0, 10)
        service.stripeService = Mock(StripeService) {
            isConfigured() >> true
            createPaymentIntent(_, _) >> [paymentIntentId: 'pi_fail', clientSecret: 'cs']
        }
        service.createFromCart(u, [
                items       : [[qty: 1, product: [id: 'hc-x']]],
                email       : u.email,
                addressLine : '1 rue', postalCode: '66000', city: 'Perpignan', shippingMode: 'Colissimo',
        ])

        when:
        Map result = service.markFailedByPaymentIntent('pi_fail')

        then:
        !result.error
        result.order.status == 'payment_failed'
        Product.get('hc-x').stock == 10
    }

    void "generated references follow the HC-2186-XXXXXXXX format and are unique across consecutive orders"() {
        given:
        User u = buildUser()
        Set<String> refs = []

        when:
        20.times {
            buildProduct("p-${it}", 'x', 10, 5)
            Map r = service.createFromCart(u, [
                    items       : [[qty: 1, product: [id: "p-${it}"]]],
                    email       : u.email,
                    addressLine : '1 rue',
                    postalCode  : '66000',
                    city        : 'Perpignan',
                    shippingMode: 'Colissimo',
            ])
            assert !r.error
            refs << r.order.reference
        }

        then:
        refs.size() == 20 // aucune collision
        refs.every { it ==~ /^HC-2186-[0-9A-F]{8}$/ }
    }

    void "updateStatus valide le libellé et rejette un statut inconnu"() {
        given:
        User u = buildUser()
        buildProduct('p', 'x', 10, 5)
        Map c = service.createFromCart(u, [
                items       : [[qty: 1, product: [id: 'p']]],
                email       : u.email,
                addressLine : '1 rue', postalCode: '66000', city: 'Perpignan', shippingMode: 'Colissimo',
        ])
        String ref = c.order.reference

        when:
        Map r1 = service.updateStatus(ref, 'shipped')

        then:
        !r1.error
        r1.order.status == 'shipped'
        r1.order.statusLabel == 'Expédiée'

        when:
        Map r2 = service.updateStatus(ref, 'wtf-invalid-status')

        then:
        r2.error == 'Statut invalide.'
    }

    void "updateStatus refuse les statuts internes pending et payment_failed (gérés par webhooks)"() {
        given:
        User u = buildUser()
        buildProduct('p', 'x', 10, 5)
        Map c = service.createFromCart(u, [
                items       : [[qty: 1, product: [id: 'p']]],
                email       : u.email,
                addressLine : '1 rue', postalCode: '66000', city: 'Perpignan', shippingMode: 'Colissimo',
        ])
        String ref = c.order.reference

        expect:
        service.updateStatus(ref, 'pending').error == 'Statut invalide.'
        service.updateStatus(ref, 'payment_failed').error == 'Statut invalide.'
    }

    void "updateStatus renvoie une erreur quand la commande n'existe pas"() {
        when:
        Map r = service.updateStatus('HC-2186-NOPE', 'shipped')

        then:
        r.error == 'Commande introuvable.'
    }
}
