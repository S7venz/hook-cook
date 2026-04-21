package backend

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import spock.lang.Specification

class LeaderboardServiceSpec extends Specification
        implements ServiceUnitTest<LeaderboardService>, DataTest {

    void setupSpec() {
        mockDomains User, CatchEntry
    }

    User buildUser(String first, String last) {
        new User(email: "${first}@x.fr", passwordHash: 'h', firstName: first, lastName: last)
                .save(failOnError: true, validate: false)
    }

    CatchEntry buildEntry(User u, Integer taille, String date, String species = 'truite', Integer poids = null) {
        new CatchEntry(
                user: u, species: species, taille: taille, poids: poids,
                spot: 'La Têt', catchDate: date,
        ).save(failOnError: true, validate: false)
    }

    void "monthly filtre bien par préfixe YYYY-MM et ignore les autres mois"() {
        given:
        User u = buildUser('Alice', 'Martin')
        buildEntry(u, 30, '2026-04-01')
        buildEntry(u, 35, '2026-04-15')
        buildEntry(u, 50, '2026-05-02') // hors mois

        when:
        List<Map> april = service.monthly(null, 2026, 4, 10)

        then:
        april.size() == 2
        april*.taille == [35, 30]
    }

    void "monthly trie par taille décroissante, puis poids, puis date d'inscription"() {
        given:
        User a = buildUser('A', 'A')
        User b = buildUser('B', 'B')
        // Même taille, poids différents
        buildEntry(a, 40, '2026-04-02', 'truite', 500)
        buildEntry(b, 40, '2026-04-03', 'truite', 700)
        // Prise plus grosse
        buildEntry(a, 45, '2026-04-01', 'truite', 100)

        when:
        List<Map> rows = service.monthly(null, 2026, 4, 10)

        then:
        rows[0].taille == 45
        rows[1].taille == 40
        rows[1].poids == 700 // le plus lourd en cas d'égalité de taille
        rows[2].taille == 40
        rows[2].poids == 500
    }

    void "monthly filtre par espèce si demandé"() {
        given:
        User u = buildUser('Alice', 'Martin')
        buildEntry(u, 30, '2026-04-01', 'truite')
        buildEntry(u, 60, '2026-04-02', 'carpe')

        expect:
        service.monthly('truite', 2026, 4, 10)*.species == ['truite']
        service.monthly('carpe', 2026, 4, 10)*.species == ['carpe']
    }

    void "angler est anonymisé avec initiale du nom"() {
        given:
        User u = buildUser('Jean', 'Dupont')
        buildEntry(u, 40, '2026-04-01')

        when:
        List<Map> rows = service.monthly(null, 2026, 4, 10)

        then:
        rows[0].angler == 'Jean D.'
    }

    void "limit tronque à N résultats"() {
        given:
        User u = buildUser('A', 'A')
        (1..5).each { buildEntry(u, 30 + it, '2026-04-01') }

        expect:
        service.monthly(null, 2026, 4, 3).size() == 3
        service.monthly(null, 2026, 4, 10).size() == 5
    }
}
