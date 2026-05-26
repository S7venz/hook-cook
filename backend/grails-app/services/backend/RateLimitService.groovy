package backend

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.dao.DataAccessException
import org.springframework.data.redis.RedisConnectionFailureException
import org.springframework.data.redis.core.StringRedisTemplate

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicLong

/**
 * Rate limiting anti-brute-force. Store NoSQL (Redis) partagé entre
 * instances backend, avec fallback in-memory si Redis est indisponible.
 *
 * Pourquoi Redis :
 *   - Compteurs éphémères, lecture/écriture sub-ms, TTL natif.
 *   - INCR atomique : pas de race-condition entre deux instances.
 *   - Si le backend tourne en plusieurs instances (load balancer), un
 *     compteur in-memory permet à l'attaquant d'alterner les instances
 *     et de doubler son quota. Avec Redis, la limite est globale.
 *
 * Algorithme : fenêtre fixe (fixed-window counter).
 *   - INCR rl:<key> → si == 1, EXPIRE rl:<key> <windowSec>.
 *   - Refus si compteur > maxRequests.
 *   - Pas de sliding window (overkill ici, fixed-window suffit contre
 *     le brute-force et coûte 1 round-trip vs 2 pour sliding).
 *
 * Fallback in-memory : si Redis répond pas (panne, timeout, env de test
 * sans container), on retombe sur un ConcurrentHashMap local. Le service
 * reste fonctionnel mais le compteur n'est plus partagé entre instances.
 */
class RateLimitService {

    static final String REDIS_KEY_PREFIX = 'rl:'

    @Autowired(required = false)
    StringRedisTemplate stringRedisTemplate

    // Fallback store si Redis est down. Garde la même sémantique de
    // fenêtre fixe que le chemin Redis pour la cohérence des tests.
    private final ConcurrentHashMap<String, Bucket> fallbackBuckets = new ConcurrentHashMap<>()

    // Évite le log spam : on logue le passage en mode dégradé une seule
    // fois par minute au lieu d'à chaque requête bloquée.
    private final AtomicLong lastFallbackLogMs = new AtomicLong(0L)
    private static final long FALLBACK_LOG_THROTTLE_MS = 60_000L

    private static class Bucket {
        AtomicInteger count = new AtomicInteger(0)
        long windowStart = System.currentTimeMillis()
    }

    /**
     * Retourne true si la requête est autorisée. False si le plafond
     * est dépassé pour la fenêtre courante.
     *
     * @param key identifiant du bucket (par ex "login:1.2.3.4" ou "pwd-reset:a@b.fr")
     * @param maxRequests nombre max de requêtes dans la fenêtre
     * @param windowMs durée de la fenêtre en millisecondes
     */
    boolean allow(String key, int maxRequests, long windowMs) {
        if (stringRedisTemplate != null) {
            try {
                return allowViaRedis(key, maxRequests, windowMs)
            } catch (RedisConnectionFailureException | DataAccessException e) {
                logFallback(e)
                // Bascule sur l'in-memory pour cette requête.
            }
        }
        return allowInMemory(key, maxRequests, windowMs)
    }

    private boolean allowViaRedis(String key, int maxRequests, long windowMs) {
        String redisKey = REDIS_KEY_PREFIX + key
        Long count = stringRedisTemplate.opsForValue().increment(redisKey)
        if (count != null && count == 1L) {
            // Première requête de la fenêtre : on pose le TTL.
            long windowSec = Math.max(1L, (long) Math.ceil(windowMs / 1000.0d))
            stringRedisTemplate.expire(redisKey, java.time.Duration.ofSeconds(windowSec))
        }
        return count != null && count <= maxRequests
    }

    private boolean allowInMemory(String key, int maxRequests, long windowMs) {
        long now = System.currentTimeMillis()
        Bucket b = fallbackBuckets.computeIfAbsent(key, { new Bucket() })
        synchronized (b) {
            if (now - b.windowStart > windowMs) {
                b.windowStart = now
                b.count.set(0)
            }
            int c = b.count.incrementAndGet()
            return c <= maxRequests
        }
    }

    private void logFallback(Exception e) {
        long now = System.currentTimeMillis()
        long last = lastFallbackLogMs.get()
        if (now - last >= FALLBACK_LOG_THROTTLE_MS &&
                lastFallbackLogMs.compareAndSet(last, now)) {
            log.warn('Rate-limit : Redis indisponible ({}), bascule sur le store in-memory local.', e.message)
        }
    }

    /**
     * Nettoie les buckets in-memory anciens. Utile uniquement pour le
     * fallback ; le store Redis gère l'expiration nativement via TTL.
     */
    void evictExpired(long windowMs) {
        long now = System.currentTimeMillis()
        fallbackBuckets.entrySet().removeIf { entry ->
            now - entry.value.windowStart > windowMs * 2
        }
    }
}
