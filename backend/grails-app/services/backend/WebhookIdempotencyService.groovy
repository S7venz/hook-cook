package backend

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.dao.DataAccessException
import org.springframework.data.redis.RedisConnectionFailureException
import org.springframework.data.redis.core.StringRedisTemplate

import java.time.Duration

/**
 * Idempotence des webhooks Stripe via Redis.
 *
 * Pourquoi : Stripe garantit une livraison *at-least-once* des events.
 * Si notre serveur crash après avoir traité l'event mais avant d'avoir
 * renvoyé 200 OK, Stripe rejouera le même event id. Sans déduplication,
 * on traite la commande deux fois (double email, double décrément stock
 * potentiel selon la séquence).
 *
 * OrderService.markPaidByPaymentIntent gère déjà l'idempotence au
 * niveau DB (status == 'paid' → return alreadyProcessed), donc Redis
 * apporte ici une couche de **défense en profondeur** :
 *   - court-circuit avant même de toucher la DB (perf)
 *   - protection si un autre type d'event (ex. payment_intent.failed
 *     puis succeeded en doublon) déclenche une bascule de statut.
 *
 * Stratégie : SETNX webhook:stripe:<event.id> 1 EX 86400.
 *   - 86400s = 24h, largement plus que la fenêtre de retry Stripe (3j
 *     mais avec backoff exponentiel : les rejeux serrés sont dans les
 *     premières heures).
 *
 * Fallback : si Redis est down, on considère l'event comme "non vu" et
 * on laisse l'event passer (fail-open). OrderService rattrapera côté DB
 * et Stripe accepte une fenêtre de tolérance. Refuser ferait retry
 * Stripe en boucle et nuirait à la santé du endpoint.
 */
class WebhookIdempotencyService {

    static final String REDIS_KEY_PREFIX = 'webhook:stripe:'
    static final Duration RETENTION = Duration.ofHours(24)

    @Autowired(required = false)
    StringRedisTemplate stringRedisTemplate

    /**
     * Tente de marquer l'event id comme "déjà vu". Retourne true si
     * c'est la première fois (poursuivre le traitement), false si
     * l'event a déjà été traité dans la fenêtre de rétention.
     *
     * En cas d'erreur Redis, retourne true (fail-open) : le traitement
     * en aval est de toute façon idempotent côté DB.
     */
    boolean acquire(String eventId) {
        if (!eventId) return true
        if (stringRedisTemplate == null) return true
        try {
            Boolean stored = stringRedisTemplate.opsForValue()
                    .setIfAbsent(REDIS_KEY_PREFIX + eventId, '1', RETENTION)
            // setIfAbsent renvoie true si la clé a été créée (= premier
            // passage), false si elle existait déjà (= doublon).
            return Boolean.TRUE == stored
        } catch (RedisConnectionFailureException | DataAccessException e) {
            log.warn('Idempotence webhook : Redis indisponible ({}), traitement laissé passer (fail-open).', e.message)
            return true
        }
    }
}
