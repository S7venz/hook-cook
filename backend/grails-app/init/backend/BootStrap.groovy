package backend

/**
 * Boot hook.
 *
 * Les données de référence (produits, concours, catégories, espèces, techniques,
 * compte admin) sont chargées une seule fois en SQL par Postgres au premier
 * démarrage du volume, via `postgres/init/01-init.sql`.
 *
 * Ce BootStrap reste volontairement vide pour ne pas dupliquer le seed.
 */
class BootStrap {

    def init = { servletContext ->
    }

    def destroy = {
    }
}
