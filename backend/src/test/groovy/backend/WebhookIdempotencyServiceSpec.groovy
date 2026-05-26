package backend

import grails.testing.services.ServiceUnitTest
import org.springframework.data.redis.RedisConnectionFailureException
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.data.redis.core.ValueOperations
import spock.lang.Specification

class WebhookIdempotencyServiceSpec extends Specification implements ServiceUnitTest<WebhookIdempotencyService> {

    void "acquire renvoie true si l'event id est nouveau (SETNX accepté)"() {
        given:
        ValueOperations<String, String> ops = Mock() {
            setIfAbsent('webhook:stripe:evt_new', '1', WebhookIdempotencyService.RETENTION) >> Boolean.TRUE
        }
        StringRedisTemplate redis = Mock() { opsForValue() >> ops }
        service.stringRedisTemplate = redis

        expect:
        service.acquire('evt_new') == true
    }

    void "acquire renvoie false si l'event id existe déjà (doublon Stripe)"() {
        given:
        ValueOperations<String, String> ops = Mock() {
            setIfAbsent('webhook:stripe:evt_dup', '1', WebhookIdempotencyService.RETENTION) >> Boolean.FALSE
        }
        StringRedisTemplate redis = Mock() { opsForValue() >> ops }
        service.stringRedisTemplate = redis

        expect:
        service.acquire('evt_dup') == false
    }

    void "acquire est fail-open si Redis est indisponible"() {
        given: 'un Redis en panne'
        ValueOperations<String, String> ops = Mock() {
            setIfAbsent(_, _, _) >> { throw new RedisConnectionFailureException('redis down') }
        }
        StringRedisTemplate redis = Mock() { opsForValue() >> ops }
        service.stringRedisTemplate = redis

        expect: "laisser passer plutôt que faire retry Stripe en boucle"
        service.acquire('evt_when_redis_down') == true
    }

    void "acquire renvoie true sans Redis injecté (mode test sans bean)"() {
        given:
        service.stringRedisTemplate = null

        expect:
        service.acquire('evt_any') == true
    }

    void "acquire renvoie true pour un id vide ou null sans appeler Redis"() {
        given:
        ValueOperations<String, String> ops = Mock()
        StringRedisTemplate redis = Mock() { opsForValue() >> ops }
        service.stringRedisTemplate = redis

        when:
        boolean nullOk = service.acquire(null)
        boolean emptyOk = service.acquire('')

        then:
        nullOk == true
        emptyOk == true
        0 * ops.setIfAbsent(_, _, _)
    }
}
