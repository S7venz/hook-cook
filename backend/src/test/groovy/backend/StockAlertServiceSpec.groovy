package backend

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import spock.lang.Specification

class StockAlertServiceSpec extends Specification implements ServiceUnitTest<StockAlertService>, DataTest {

    void setupSpec() {
        mockDomains User, Product, StockAlert
    }

    def setup() {
        // MailService mock pour éviter d'envoyer des mails réels et
        // d'avoir besoin d'un JavaMailSender configuré.
        service.mailService = Mock(MailService)
    }

    User buildUser() {
        new User(email: 'u@test.fr', passwordHash: 'h', firstName: 'U', lastName: 'T')
                .save(failOnError: true, validate: false)
    }

    Product buildProduct(int stock = 0, String id = 'p1') {
        Product p = new Product(sku: 'S', name: 'X', category: 'cannes', price: 10, stock: stock)
        p.id = id
        p.save(failOnError: true, validate: false)
    }

    void "subscribe exige une authentification"() {
        expect:
        service.subscribe(null, 'p1').error == 'Authentification requise.'
    }

    void "subscribe refuse si le produit est introuvable"() {
        given:
        User u = buildUser()

        expect:
        service.subscribe(u, 'ghost').error == 'Produit introuvable.'
    }

    void "subscribe refuse si le produit est déjà en stock"() {
        given:
        User u = buildUser()
        buildProduct(10, 'p-in-stock')

        expect:
        service.subscribe(u, 'p-in-stock').error == 'Ce produit est déjà en stock.'
    }

    void "subscribe crée une alerte pour un produit épuisé"() {
        given:
        User u = buildUser()
        buildProduct(0, 'p-zero')

        when:
        Map r = service.subscribe(u, 'p-zero')

        then:
        !r.error
        r.alert.productId == 'p-zero'
        r.alert.notified == false
    }

    void "subscribe est idempotent sur les alertes actives du même user"() {
        given:
        User u = buildUser()
        buildProduct(0, 'p')

        when:
        service.subscribe(u, 'p')
        Map second = service.subscribe(u, 'p')

        then:
        second.alreadyPresent == true
        StockAlert.countByUserAndProductIdAndNotified(u, 'p', false) == 1
    }

    void "notifyReplenish envoie un mail et marque notified pour chaque alerte en attente"() {
        given:
        User a = new User(email: 'a@x.fr', passwordHash: 'h', firstName: 'A', lastName: 'A')
                .save(failOnError: true, validate: false)
        User b = new User(email: 'b@x.fr', passwordHash: 'h', firstName: 'B', lastName: 'B')
                .save(failOnError: true, validate: false)
        Product p = buildProduct(0, 'waited')
        service.subscribe(a, 'waited')
        service.subscribe(b, 'waited')

        // Le produit repasse en stock
        p.stock = 5
        p.save(failOnError: true, validate: false)

        when:
        service.notifyReplenish('waited')

        then:
        2 * service.mailService.stockReplenish(_, _)
        StockAlert.findAllByProductId('waited').every { it.notified }
        StockAlert.findAllByProductId('waited').every { it.notifiedAt != null }
    }

    void "notifyReplenish ne fait rien si le stock est encore à 0"() {
        given:
        User u = buildUser()
        buildProduct(0, 'still-empty')
        service.subscribe(u, 'still-empty')

        when:
        service.notifyReplenish('still-empty')

        then:
        0 * service.mailService.stockReplenish(_, _)
        StockAlert.findByProductId('still-empty').notified == false
    }
}
