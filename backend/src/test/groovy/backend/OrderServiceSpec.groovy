package backend

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import spock.lang.Specification

class OrderServiceSpec extends Specification implements ServiceUnitTest<OrderService>, DataTest {

    void setupSpec() {
        mockDomains User, CustomerOrder, OrderItem
    }

    User buildUser() {
        new User(
                email: 'alice@test.fr',
                passwordHash: 'x',
                firstName: 'Alice',
                lastName: 'Martin',
        ).save(failOnError: true, validate: false)
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

    void "createFromCart computes totals and snapshots product data"() {
        given:
        User u = buildUser()
        Map payload = [
                items       : [
                        [qty: 2, product: [id: 'hc-x', name: 'Canne X', sku: 'SKU1', brand: 'HC', price: 50.0, imageUrl: null]],
                        [qty: 1, product: [id: 'hc-y', name: 'Leurre Y', sku: 'SKU2', brand: 'HC', price: 20.0, imageUrl: null]],
                ],
                email       : 'alice@test.fr',
                shipping    : 5.9,
                addressLine : '1 rue du Lac',
                postalCode  : '66000',
                city        : 'Perpignan',
                shippingMode: 'Standard Colissimo',
        ]

        when:
        Map result = service.createFromCart(u, payload)

        then:
        !result.error
        result.order.subtotal == 120.0
        result.order.shipping == 5.9
        result.order.total == 125.9
        result.order.status == 'paid'
        result.order.items.size() == 2
        result.order.items.find { it.productId == 'hc-x' }.qty == 2
    }

    void "generated references follow the HC-2186-XXXXXXXX format and are unique across consecutive orders"() {
        given:
        User u = buildUser()
        Set<String> refs = []

        when:
        20.times {
            Map r = service.createFromCart(u, [
                    items       : [[qty: 1, product: [id: "p-${it}", name: 'x', price: 10]]],
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
        Map c = service.createFromCart(u, [
                items       : [[qty: 1, product: [id: 'p', name: 'x', price: 10]]],
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

    void "updateStatus renvoie une erreur quand la commande n'existe pas"() {
        when:
        Map r = service.updateStatus('HC-2186-NOPE', 'shipped')

        then:
        r.error == 'Commande introuvable.'
    }
}
