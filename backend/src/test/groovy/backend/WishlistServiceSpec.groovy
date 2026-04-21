package backend

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import spock.lang.Specification

class WishlistServiceSpec extends Specification implements ServiceUnitTest<WishlistService>, DataTest {

    void setupSpec() {
        mockDomains User, Product, WishlistItem
    }

    User buildUser() {
        new User(email: 'u@test.fr', passwordHash: 'h', firstName: 'U', lastName: 'T')
                .save(failOnError: true, validate: false)
    }

    Product buildProduct(String id = 'hc-x') {
        Product p = new Product(sku: 'SKU', name: 'X', category: 'cannes', price: 10, stock: 5)
        p.id = id
        p.save(failOnError: true, validate: false)
    }

    void "add requires an authenticated user"() {
        expect:
        service.add(null, 'hc-x').error == 'Authentification requise.'
    }

    void "add requires a productId"() {
        given:
        User u = buildUser()

        expect:
        service.add(u, null).error == 'productId requis.'
        service.add(u, '').error == 'productId requis.'
    }

    void "add refuse si le produit n'existe pas"() {
        given:
        User u = buildUser()

        expect:
        service.add(u, 'ghost').error == 'Produit introuvable.'
    }

    void "add crée un favori et est idempotent"() {
        given:
        User u = buildUser()
        Product p = buildProduct()

        when:
        Map first = service.add(u, p.id)
        Map second = service.add(u, p.id)

        then:
        !first.error
        !first.alreadyPresent
        first.item.productId == p.id
        !second.error
        second.alreadyPresent == true
        WishlistItem.countByUser(u) == 1
    }

    void "remove est idempotent : supprimer un favori inexistant ne plante pas"() {
        given:
        User u = buildUser()

        when:
        Map r1 = service.remove(u, 'never-favorited')
        Map r2 = service.remove(u, 'never-favorited')

        then:
        r1.ok == true
        r2.ok == true
    }

    void "un user ne voit que ses propres favoris"() {
        given:
        User a = new User(email: 'a@x.fr', passwordHash: 'h', firstName: 'A', lastName: 'A')
                .save(failOnError: true, validate: false)
        User b = new User(email: 'b@x.fr', passwordHash: 'h', firstName: 'B', lastName: 'B')
                .save(failOnError: true, validate: false)
        Product p1 = buildProduct('p1')
        Product p2 = buildProduct('p2')
        service.add(a, p1.id)
        service.add(b, p2.id)

        expect:
        service.forUser(a)*.productId == ['p1']
        service.forUser(b)*.productId == ['p2']
    }
}
