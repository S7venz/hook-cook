package backend

import grails.testing.services.ServiceUnitTest
import spock.lang.Specification

class RateLimitServiceSpec extends Specification implements ServiceUnitTest<RateLimitService> {

    void "allow passe tant que le plafond n'est pas atteint et bloque ensuite"() {
        expect:
        service.allow('login:ip-a', 3, 60_000)
        service.allow('login:ip-a', 3, 60_000)
        service.allow('login:ip-a', 3, 60_000)
        !service.allow('login:ip-a', 3, 60_000)
        !service.allow('login:ip-a', 3, 60_000)
    }

    void "les buckets sont isolés par clé"() {
        expect:
        service.allow('a', 1, 60_000)
        !service.allow('a', 1, 60_000)
        service.allow('b', 1, 60_000) // clé différente, même limite
    }

    void "la fenêtre redémarre une fois expirée"() {
        given: 'un bucket avec une fenêtre très courte'

        when:
        boolean first = service.allow('k', 1, 10)
        Thread.sleep(25)
        boolean afterWindow = service.allow('k', 1, 10)

        then:
        first == true
        afterWindow == true // la fenêtre a été réinitialisée
    }

    void "evictExpired supprime les buckets inactifs"() {
        given:
        service.allow('old-key', 5, 10)

        when:
        Thread.sleep(30)
        service.evictExpired(10)

        then:
        // Après éviction, un nouveau hit crée un bucket neuf à compteur 1
        service.allow('old-key', 1, 10) == true
    }
}
