package backend

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

/**
 * Rate limiting en mémoire — bucket par clé (IP ou email).
 *
 * Simple, sans dépendance externe. Une vraie prod devrait utiliser
 * Bucket4j ou un store externe (Redis) partagé entre instances, mais
 * pour un backend monolithique mono-instance comme ici, ça suffit.
 *
 * Comptage en fenêtre glissante d'une minute : on compte les hits
 * depuis le dernier reset, qui a lieu soit au bout de `windowMs` ms,
 * soit à la première requête après expiration.
 */
class RateLimitService {

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>()

    private static class Bucket {
        AtomicInteger count = new AtomicInteger(0)
        long windowStart = System.currentTimeMillis()
    }

    /**
     * Retourne true si la requête est autorisée. False si le plafond est
     * dépassé pour la fenêtre courante.
     *
     * @param key identifiant du bucket (par ex "ip:1.2.3.4" ou "login:a@b.fr")
     * @param maxRequests nombre max de requêtes dans la fenêtre
     * @param windowMs durée de la fenêtre en millisecondes
     */
    boolean allow(String key, int maxRequests, long windowMs) {
        long now = System.currentTimeMillis()
        Bucket b = buckets.computeIfAbsent(key, { new Bucket() })
        synchronized (b) {
            if (now - b.windowStart > windowMs) {
                b.windowStart = now
                b.count.set(0)
            }
            int c = b.count.incrementAndGet()
            return c <= maxRequests
        }
    }

    /**
     * Nettoie les buckets anciens pour éviter un leak mémoire à long terme.
     * Appelé périodiquement par un scheduled task ou au gré des hits.
     */
    void evictExpired(long windowMs) {
        long now = System.currentTimeMillis()
        buckets.entrySet().removeIf { entry ->
            now - entry.value.windowStart > windowMs * 2
        }
    }
}
