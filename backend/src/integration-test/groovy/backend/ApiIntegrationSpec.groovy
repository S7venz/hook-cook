package backend

import grails.testing.mixin.integration.Integration
import org.springframework.beans.factory.annotation.Value
import spock.lang.Specification

import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

/**
 * Tests d'intégration HTTP de bout en bout.
 *
 * Contrairement aux specs unitaires (qui mockent les collaborateurs et testent
 * un service isolé), ces tests démarrent réellement le serveur Grails et envoient
 * de vraies requêtes HTTP : la chaîne complète est exercée
 * (UrlMappings -> contrôleur -> service -> GORM -> base). Ils valident le routage
 * REST et surtout la sécurité d'AUTORISATION par endpoint, qui ne peut pas être
 * vérifiée au seul niveau service.
 */
@Integration
class ApiIntegrationSpec extends Specification {

    @Value('${local.server.port}')
    Integer serverPort

    private final HttpClient http = HttpClient.newHttpClient()

    private HttpResponse<String> get(String path, String token = null) {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create("http://localhost:${serverPort}${path}")).GET()
        if (token) b.header('Authorization', "Bearer ${token}")
        http.send(b.build(), HttpResponse.BodyHandlers.ofString())
    }

    void "GET /api/products repond 200 (chaine complete controleur -> service -> base)"() {
        when:
        HttpResponse<String> resp = get('/api/products')

        then: 'endpoint public : le catalogue est servi'
        resp.statusCode() == 200
        resp.body()?.trim()?.startsWith('[')
    }

    void "GET /api/auth/me sans jeton est refuse (401) : l'authentification est exigee au niveau HTTP"() {
        when:
        HttpResponse<String> resp = get('/api/auth/me')

        then:
        resp.statusCode() == 401
    }

    void "GET /api/admin/stats sans le role admin est refuse (403) : l'autorisation par endpoint protege l'admin"() {
        when:
        HttpResponse<String> resp = get('/api/admin/stats')

        then: 'aucun jeton ne donne le role ROLE_ADMIN -> acces interdit'
        resp.statusCode() == 403
    }
}
