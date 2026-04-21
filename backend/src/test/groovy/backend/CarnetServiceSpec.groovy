package backend

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import spock.lang.Specification

class CarnetServiceSpec extends Specification implements ServiceUnitTest<CarnetService>, DataTest {

    void setupSpec() {
        mockDomains User, CatchEntry
    }

    User buildUser(String email, String role = 'ROLE_USER') {
        new User(email: email, passwordHash: 'h', firstName: 'F', lastName: 'L', role: role)
                .save(failOnError: true, validate: false)
    }

    void "create exige les champs obligatoires"() {
        given:
        User u = buildUser('x@test.fr')

        expect:
        service.create(u, [:]).error == 'Espèce, taille et lieu requis.'
    }

    void "create enregistre une prise valide"() {
        given:
        User u = buildUser('x@test.fr')

        when:
        Map r = service.create(u, [
                species: 'truite', taille: 34, poids: 420,
                spot: 'La Têt — Olette', bait: 'Sedge', weather: 'Couvert',
                date: '2026-04-15',
        ])

        then:
        !r.error
        r.entry.species == 'truite'
        r.entry.taille == 34
    }

    void "remove renvoie le même message pour id inexistant ET id d'un autre user (anti-enumeration)"() {
        given:
        User a = buildUser('a@x.fr')
        User b = buildUser('b@x.fr')
        Map ownEntry = service.create(a, [species: 'truite', taille: 30, spot: 'S', date: '2026-04-01'])
        Long ownId = ownEntry.entry.id

        expect: 'suppression par un autre user renvoie "Prise introuvable."'
        service.remove(b, ownId).error == 'Prise introuvable.'

        and: 'suppression d\'un id inexistant renvoie le même message'
        service.remove(b, 99999L).error == 'Prise introuvable.'
    }

    void "remove laisse l'admin supprimer n'importe quelle prise"() {
        given:
        User owner = buildUser('owner@x.fr')
        User admin = buildUser('admin@x.fr', 'ROLE_ADMIN')
        Map e = service.create(owner, [species: 'carpe', taille: 60, spot: 'Vinça', date: '2026-05-01'])

        when:
        Map r = service.remove(admin, e.entry.id)

        then:
        r.ok == true
        CatchEntry.get(e.entry.id) == null
    }

    void "forUser ne renvoie que les prises de cet utilisateur"() {
        given:
        User a = buildUser('a@x.fr')
        User b = buildUser('b@x.fr')
        service.create(a, [species: 'truite', taille: 30, spot: 'S', date: '2026-04-01'])
        service.create(a, [species: 'ombre', taille: 28, spot: 'S', date: '2026-04-02'])
        service.create(b, [species: 'carpe', taille: 60, spot: 'V', date: '2026-04-03'])

        expect:
        service.forUser(a).size() == 2
        service.forUser(b).size() == 1
    }
}
