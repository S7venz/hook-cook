package backend

import grails.testing.services.ServiceUnitTest
import org.springframework.data.redis.RedisConnectionFailureException
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.data.redis.core.ValueOperations
import spock.lang.Specification

class RateLimitServiceSpec extends Specification implements ServiceUnitTest<RateLimitService> {

    // --- Chemin fallback in-memory (stringRedisTemplate null) ----------------

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

    // --- Chemin Redis (StringRedisTemplate injecté) --------------------------

    void "allow utilise INCR Redis et pose le TTL au premier hit"() {
        given:
        ValueOperations<String, String> ops = Mock()
        StringRedisTemplate redis = Mock() {
            opsForValue() >> ops
        }
        service.stringRedisTemplate = redis

        when:
        boolean ok = service.allow('login:1.2.3.4', 3, 60_000)

        then: 'INCR appelé puis EXPIRE car compteur == 1'
        1 * ops.increment('rl:login:1.2.3.4') >> 1L
        1 * redis.expire('rl:login:1.2.3.4', _) >> true
        ok == true
    }

    void "allow refuse quand le compteur Redis dépasse maxRequests"() {
        given:
        ValueOperations<String, String> ops = Mock()
        StringRedisTemplate redis = Mock() {
            opsForValue() >> ops
        }
        service.stringRedisTemplate = redis

        when:
        boolean ok = service.allow('login:abuser', 3, 60_000)

        then: '4ème requête : INCR retourne 4 > max=3'
        1 * ops.increment('rl:login:abuser') >> 4L
        0 * redis.expire(_, _) // pas de TTL renouvelé après le 1er
        ok == false
    }

    void "allow bascule sur le store in-memory si Redis lève une exception"() {
        given: 'un Redis qui tombe en panne'
        ValueOperations<String, String> ops = Mock() {
            increment(_) >> { throw new RedisConnectionFailureException('down') }
        }
        StringRedisTemplate redis = Mock() {
            opsForValue() >> ops
        }
        service.stringRedisTemplate = redis

        when: 'on appelle 2 fois avec un plafond de 1'
        boolean first = service.allow('fb-key', 1, 60_000)
        boolean second = service.allow('fb-key', 1, 60_000)

        then: 'le fallback in-memory accepte la 1ère et refuse la 2ème'
        first == true
        second == false
    }
}
