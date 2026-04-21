package backend

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import spock.lang.Specification

class ReviewServiceSpec extends Specification implements ServiceUnitTest<ReviewService>, DataTest {

    void setupSpec() {
        mockDomains User, Product, CustomerOrder, OrderItem, ProductReview
    }

    User buildUser(String email = 'user@test.fr') {
        new User(email: email, passwordHash: 'h', firstName: 'Jean', lastName: 'Test')
                .save(failOnError: true, validate: false)
    }

    Product buildProduct(String id = 'hc-sauvage') {
        Product p = new Product(
                sku: 'SKU', name: 'Canne Sauvage', category: 'cannes',
                price: 100.0, stock: 5,
        )
        p.id = id
        p.save(failOnError: true, validate: false)
    }

    CustomerOrder buildOrderWith(User u, String productId, String status = 'paid') {
        CustomerOrder o = new CustomerOrder(
                reference: "HC-TEST-${System.nanoTime()}".take(40),
                user: u,
                subtotal: 100, shipping: 0, total: 100,
                email: u.email, addressLine: '1 rue', postalCode: '66000',
                city: 'Perpignan', shippingMode: 'Colissimo',
                status: status, statusLabel: 'Payée',
        )
        o.addToItems(new OrderItem(
                productId: productId, productName: 'x', productSku: 'x',
                unitPrice: 100, qty: 1,
        ))
        o.save(failOnError: true, validate: false)
    }

    void "create refuse les users non authentifiés"() {
        expect:
        service.create(null, 'hc-sauvage', [:]).error == 'Authentification requise.'
    }

    void "create refuse si le produit n'existe pas"() {
        given:
        User u = buildUser()

        expect:
        service.create(u, 'ghost-product', [rating: 5, comment: 'blabla rayon']).error == 'Produit introuvable.'
    }

    void "create refuse une note hors 1-5"() {
        given:
        User u = buildUser()
        Product p = buildProduct()
        buildOrderWith(u, p.id)

        expect:
        service.create(u, p.id, [rating: 0, comment: 'trop court']).error == 'Note invalide (1 à 5).'
        service.create(u, p.id, [rating: 6, comment: 'commentaire assez long là']).error == 'Note invalide (1 à 5).'
    }

    void "create refuse un commentaire trop court"() {
        given:
        User u = buildUser()
        Product p = buildProduct()
        buildOrderWith(u, p.id)

        expect:
        service.create(u, p.id, [rating: 4, comment: 'ok']).error == 'Commentaire trop court (10 caractères min).'
    }

    void "create refuse quand l'utilisateur n'a jamais acheté le produit"() {
        given:
        User u = buildUser()
        Product p = buildProduct()

        expect:
        service.create(u, p.id, [rating: 5, comment: 'Super canne vraiment top pour la truite']).error ==
                'Seuls les clients ayant acheté ce produit peuvent laisser un avis.'
    }

    void "create accepte un user qui a acheté le produit"() {
        given:
        User u = buildUser()
        Product p = buildProduct()
        buildOrderWith(u, p.id, 'delivered')

        when:
        Map r = service.create(u, p.id, [rating: 5, comment: 'Excellente canne, bien équilibrée, parfaite pour la truite en rivière.'])

        then:
        !r.error
        r.review.rating == 5
        r.review.verifiedPurchase == true
    }

    void "create empêche de laisser deux avis sur le même produit"() {
        given:
        User u = buildUser()
        Product p = buildProduct()
        buildOrderWith(u, p.id)
        service.create(u, p.id, [rating: 5, comment: 'Premier avis déjà écrit'])

        when:
        Map r = service.create(u, p.id, [rating: 3, comment: 'Deuxième avis tentative'])

        then:
        r.error == 'Vous avez déjà laissé un avis sur ce produit.'
    }

    void "eligibility retourne la bonne raison selon le contexte"() {
        given:
        User u = buildUser()
        Product p = buildProduct()

        expect:
        service.eligibility(null, p.id) == [eligible: false, reason: 'not_logged_in']
        service.eligibility(u, p.id) == [eligible: false, reason: 'not_purchased']

        when: 'il achète'
        buildOrderWith(u, p.id)

        then:
        service.eligibility(u, p.id).eligible == true

        when: 'il laisse un avis'
        service.create(u, p.id, [rating: 5, comment: 'Commentaire correct minimum 10 caractères'])

        then:
        service.eligibility(u, p.id).reason == 'already_reviewed'
    }

    void "l'agrégation de note moyenne est mise à jour sur le produit"() {
        given:
        User u1 = buildUser('u1@test.fr')
        User u2 = buildUser('u2@test.fr')
        Product p = buildProduct()
        buildOrderWith(u1, p.id)
        buildOrderWith(u2, p.id)

        when:
        service.create(u1, p.id, [rating: 5, comment: 'Premier avis client bien tapé'])
        service.create(u2, p.id, [rating: 3, comment: 'Second avis mitigé 10+ chars'])

        then:
        p.refresh()
        p.rating == 4.0
        p.reviews == 2
    }
}
