package backend

import groovy.json.JsonOutput
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder

/**
 * Boot hook.
 *
 * Le gros du référentiel (produits, concours, catégories, espèces, techniques)
 * est chargé une seule fois en SQL par Postgres au premier démarrage du volume,
 * via `postgres/init/01-init.sql`.
 *
 * Ici on gère idempotemment :
 *   1. Les tables de référence ajoutées après le dump initial (types de permis,
 *      départements) — protégées par un `get(id)` pour ne jamais dupliquer.
 *   2. Le compte admin, créé/mis à jour depuis les variables d'environnement
 *      ADMIN_EMAIL / ADMIN_PASSWORD (fail si absents en PRODUCTION).
 */
class BootStrap {

    def init = { servletContext ->
        PermitType.withTransaction { ensurePermitTypes() }
        Department.withTransaction { ensureDepartments() }
        User.withTransaction { ensureAdmin() }
        DemoSeedData.seedIfNeeded()
    }

    def destroy = {
    }

    private void ensureAdmin() {
        String email = System.getenv('ADMIN_EMAIL')
        String password = System.getenv('ADMIN_PASSWORD')

        boolean isProd = grails.util.Environment.current == grails.util.Environment.PRODUCTION

        if (!email || !password) {
            if (isProd) {
                throw new IllegalStateException(
                        'ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis en production. ' +
                        'Ajoute-les à ton .env avant de démarrer.')
            }
            email = email ?: 'admin@hookcook.fr'
            password = password ?: 'admin1234'
            log.warn('Admin seeding : utilisation des valeurs par défaut (dev). Ne pas déployer en prod.')
        }

        if (isProd && password.length() < 10) {
            throw new IllegalStateException(
                    'ADMIN_PASSWORD trop court (< 10 caractères) pour un déploiement production. ' +
                    'Génère-en un fort avec :\n' +
                    '  python -c "import secrets; print(secrets.token_urlsafe(24))"')
        }

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12)
        User admin = User.findByEmail(email)
        if (!admin) {
            admin = new User(
                    email: email,
                    passwordHash: encoder.encode(password),
                    firstName: 'Admin',
                    lastName: 'Hook & Cook',
                    role: 'ROLE_ADMIN',
            )
            admin.save(flush: true, failOnError: true)
            log.info('Admin créé : {}', email)
        } else if (!encoder.matches(password, admin.passwordHash)) {
            // Si le mot de passe a changé dans l'env, on met à jour
            admin.passwordHash = encoder.encode(password)
            admin.role = 'ROLE_ADMIN'
            admin.save(flush: true, failOnError: true)
            log.info('Admin mis à jour : {}', email)
        }
    }

    private void ensurePermitTypes() {
        [
                [id   : 'annuel',
                 title: 'Permis annuel',
                 label: 'Le plus choisi',
                 price: 92.00,
                 items: [
                         'Valide du 1er janv. au 31 déc.',
                         'Toutes eaux 1re et 2e catégorie',
                         'CPMA incluse',
                 ]],
                [id   : 'semaine',
                 title: 'Permis semaine',
                 label: 'Vacances',
                 price: 28.00,
                 items: ['7 jours consécutifs', 'Carte interfédérale', 'Idéal séjour']],
                [id   : 'decouverte',
                 title: 'Découverte',
                 label: '-12 ans',
                 price: 6.00,
                 items: ["Mineurs jusqu'à 12 ans", "Toute l'année", 'Carte gratuite -2 ans']],
        ].each { row ->
            if (!PermitType.get(row.id)) {
                PermitType t = new PermitType(
                        title    : row.title,
                        label    : row.label,
                        price    : row.price as BigDecimal,
                        itemsJson: JsonOutput.toJson(row.items),
                )
                t.id = row.id
                t.save(flush: true, failOnError: true)
            }
        }
    }

    private void ensureDepartments() {
        [
                [id: '66', name: '66 — Pyrénées-Orientales'],
                [id: '11', name: '11 — Aude'],
                [id: '09', name: '09 — Ariège'],
                [id: '34', name: '34 — Hérault'],
        ].each { row ->
            if (!Department.get(row.id)) {
                Department d = new Department(name: row.name)
                d.id = row.id
                d.save(flush: true, failOnError: true)
            }
        }
    }
}
