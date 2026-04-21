package backend

import groovy.json.JsonOutput

/**
 * Boot hook.
 *
 * Le gros du référentiel (produits, concours, catégories, espèces, techniques,
 * compte admin) est chargé une seule fois en SQL par Postgres au premier
 * démarrage du volume, via `postgres/init/01-init.sql`.
 *
 * On conserve ici un seed idempotent pour les tables de référence ajoutées
 * après le dump initial (types de permis, départements). Ces insertions sont
 * protégées par un `get(id)` pour ne jamais dupliquer.
 */
class BootStrap {

    def init = { servletContext ->
        PermitType.withTransaction { ensurePermitTypes() }
        Department.withTransaction { ensureDepartments() }
    }

    def destroy = {
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
