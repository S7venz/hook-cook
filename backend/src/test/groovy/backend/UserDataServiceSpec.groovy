package backend

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import groovy.json.JsonSlurper
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import spock.lang.Specification

class UserDataServiceSpec extends Specification implements ServiceUnitTest<UserDataService>, DataTest {

    void setupSpec() {
        mockDomains User, CustomerOrder, OrderItem, Permit, PermitType, Department,
                ContestRegistration, Contest, CatchEntry, WishlistItem, ProductReview,
                StockAlert, Product
    }

    User buildUser(String email = 'alice@test.fr', String role = 'ROLE_USER') {
        new User(
                email: email, passwordHash: '$2a$12$hash',
                firstName: 'Alice', lastName: 'Martin',
                phone: '0612345678',
                addressLine: '1 rue de la Têt', postalCode: '66000', city: 'Perpignan',
                country: 'France', role: role,
        ).save(failOnError: true, validate: false)
    }

    // ────────── Export ───────────────────────────────────────────

    void "exportUserData regroupe profil + toutes les entités liées"() {
        given:
        User u = buildUser()
        // Une commande avec un item
        CustomerOrder o = new CustomerOrder(
                reference: 'HC-X-1', user: u,
                subtotal: 10, shipping: 0, total: 10,
                email: u.email, addressLine: '1 rue', postalCode: '66000',
                city: 'Perpignan', shippingMode: 'Colissimo',
                status: 'paid', statusLabel: 'Payée',
        )
        o.addToItems(new OrderItem(
                productId: 'p1', productName: 'x', productSku: 's', unitPrice: 10, qty: 1,
        ))
        o.save(failOnError: true, validate: false)

        // Carnet + wishlist + avis
        new CatchEntry(user: u, species: 'truite', taille: 30, spot: 'Têt', catchDate: '2026-04-01')
                .save(failOnError: true, validate: false)
        new WishlistItem(user: u, productId: 'p1').save(failOnError: true, validate: false)
        new ProductReview(user: u, productId: 'p1', rating: 5, comment: 'Excellent produit bien note')
                .save(failOnError: true, validate: false)

        when:
        Map data = service.exportUserData(u)

        then:
        data.profile.email == 'alice@test.fr'
        data.profile.firstName == 'Alice'
        data.profile.role == 'ROLE_USER'
        data.orders.size() == 1
        data.orders[0].id == 'HC-X-1'
        data.carnet.size() == 1
        data.wishlist.size() == 1
        data.reviews.size() == 1
        data.exportedAt != null
    }

    void "exportUserDataAsJson renvoie un JSON pretty-printé valide"() {
        given:
        User u = buildUser()

        when:
        String json = service.exportUserDataAsJson(u)
        Map parsed = new JsonSlurper().parseText(json)

        then:
        json.contains('\n') // pretty-printed
        parsed.profile.email == 'alice@test.fr'
    }

    // ────────── Anonymisation — bugs reproduits ──────────────────

    void "anonymizeUser échoue explicitement sur un compte admin"() {
        given:
        User admin = buildUser('admin@test.fr', 'ROLE_ADMIN')

        when:
        Map r = service.anonymizeUser(admin)

        then:
        r.error == 'Impossible de supprimer un compte administrateur.'
    }

    void "anonymizeUser exige un user non null"() {
        expect:
        service.anonymizeUser(null).error == 'Utilisateur introuvable.'
    }

    void "REGRESSION : le nouvel email anonymisé passe le validateur Grails"() {
        // Bug corrige : avant, l'email anonymise utilisait le TLD .local
        // qui echouait silencieusement a la validation, laissant le
        // passwordHash intact. Ce test garantit qu'on n'y retournera pas.
        given:
        User u = buildUser()
        Long originalId = u.id
        String originalHash = u.passwordHash

        when:
        Map r = service.anonymizeUser(u)

        then:
        r.ok == true
        r.anonymizedAt != null

        and: 'le user est effectivement anonymise en BDD'
        User refreshed = User.get(originalId)
        refreshed != null
        refreshed.email.startsWith('anonyme-')
        refreshed.email.endsWith('.fr') // TLD valide (pas .local ni .demo)
        refreshed.email != 'alice@test.fr'

        and: 'le hash est neutralise'
        refreshed.passwordHash != originalHash
        refreshed.passwordHash.contains('INVALIDATED')

        and: 'les donnees PII sont videes'
        refreshed.firstName == 'Anonyme'
        refreshed.phone == null
        refreshed.addressLine == null
    }

    void "anonymizeUser supprime wishlist, carnet, reviews, stock alerts"() {
        given:
        User u = buildUser()
        new WishlistItem(user: u, productId: 'p').save(failOnError: true, validate: false)
        new CatchEntry(user: u, species: 'truite', taille: 30, spot: 'x', catchDate: '2026-04-01')
                .save(failOnError: true, validate: false)
        new ProductReview(user: u, productId: 'p', rating: 4, comment: 'Bien emballe produit')
                .save(failOnError: true, validate: false)
        new StockAlert(user: u, productId: 'p').save(failOnError: true, validate: false)

        when:
        Map r = service.anonymizeUser(u)

        then:
        r.ok == true
        r.deletions.wishlist == 1
        r.deletions.carnet == 1
        r.deletions.reviews == 1
        r.deletions.stockAlerts == 1
        WishlistItem.count() == 0
        CatchEntry.count() == 0
        ProductReview.count() == 0
        StockAlert.count() == 0
    }

    void "anonymizeUser conserve les commandes mais les anonymise (obligation fiscale 10 ans)"() {
        given:
        User u = buildUser()
        CustomerOrder o = new CustomerOrder(
                reference: 'HC-KEEP-1', user: u,
                subtotal: 100, shipping: 0, total: 100,
                email: u.email, addressLine: '42 rue de la Tete',
                postalCode: '66000', city: 'Perpignan', shippingMode: 'Colissimo',
                status: 'delivered', statusLabel: 'Livree',
        )
        o.save(failOnError: true, validate: false)

        when:
        Map r = service.anonymizeUser(u)

        then:
        r.ok == true
        r.anonymizations.orders == 1

        and: 'la commande existe toujours mais est anonymisee'
        CustomerOrder.count() == 1
        CustomerOrder kept = CustomerOrder.findByReference('HC-KEEP-1')
        kept != null
        kept.email.startsWith('anonyme-')
        kept.email.endsWith('.fr')
        kept.addressLine == 'Adresse supprimée (RGPD)'
        kept.postalCode == '00000'
        kept.city == 'Anonyme'
    }

    void "anonymizeUser vide les pièces sensibles des permis mais conserve la référence"() {
        given:
        User u = buildUser()
        PermitType t = new PermitType(title: 'Permis annuel', price: 92.00, itemsJson: '[]')
        t.id = 'annuel'
        t.save(failOnError: true)
        Permit p = new Permit(
                reference: 'FR-KEEP-42', user: u,
                typeId: 'annuel', typeTitle: 'Permis annuel', amount: 92,
                department: '66 - Pyrenees-Orientales',
                firstName: 'Alice', lastName: 'Martin', birthDate: '1990-01-01',
                status: 'approved', statusLabel: 'Approuve',
                idDocUrl: 'http://x/id.jpg', photoDocUrl: 'http://x/photo.jpg',
        )
        p.save(failOnError: true, validate: false)

        when:
        Map r = service.anonymizeUser(u)

        then:
        r.ok == true
        r.anonymizations.permits == 1

        and: 'le permis existe mais les infos perso sont videes'
        Permit kept = Permit.findByReference('FR-KEEP-42')
        kept != null
        kept.firstName == 'Anonyme'
        kept.lastName.startsWith('user-')
        kept.birthDate == '0000-00-00'
        kept.idDocUrl == null
        kept.photoDocUrl == null
    }

    void "anonymizeUser décrémente le compteur inscrits sur chaque concours"() {
        given:
        User u = buildUser()
        Contest c = new Contest(
                title: 'Open', date: '2026-05-04', dateDisplay: '04 MAI',
                lieu: 'Olette', inscrits: 5, max: 40,
        )
        c.id = 'open-tet'
        c.save(failOnError: true, validate: false)
        new ContestRegistration(user: u, contest: c, category: 'femmes')
                .save(failOnError: true, validate: false)

        when:
        Map r = service.anonymizeUser(u)

        then:
        r.ok == true
        r.deletions.contestRegistrations == 1
        ContestRegistration.count() == 0

        and: 'le compteur du concours est décrémenté'
        Contest.get('open-tet').inscrits == 4
    }
}
