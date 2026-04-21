package backend

import grails.gorm.transactions.Transactional

import java.time.LocalDate

/**
 * Calcul des classements mensuels basés sur les entrées du carnet.
 *
 * Règles du challenge "plus grosse prise du mois" :
 *   - On ne compte que les prises avec catchDate au format YYYY-MM
 *     qui tombe dans le mois demandé (courant par défaut).
 *   - Classement par taille décroissante, puis par poids décroissant,
 *     puis par date de saisie croissante (le premier inscrit gagne
 *     en cas d'égalité totale).
 *   - On expose prénom + initiale nom de l'auteur (privacy).
 *
 * Pas d'index dédié en base — quelques dizaines de prises par mois
 * tout au plus, scan complet acceptable.
 */
@Transactional(readOnly = true)
class LeaderboardService {

    /**
     * Classement mensuel par espèce OU global (species = null).
     */
    List<Map> monthly(String species, int year, int month, int limit = 10) {
        String prefix = String.format('%04d-%02d', year, month)

        List<CatchEntry> entries
        if (species) {
            entries = CatchEntry.findAllBySpeciesAndCatchDateLike(species, "${prefix}%")
        } else {
            entries = CatchEntry.findAllByCatchDateLike("${prefix}%")
        }

        entries.sort { a, b ->
            // taille desc, puis poids desc, puis date asc
            if (a.taille != b.taille) return (b.taille ?: 0) - (a.taille ?: 0)
            int pa = a.poids ?: 0
            int pb = b.poids ?: 0
            if (pa != pb) return pb - pa
            return (a.dateCreated?.time ?: 0L).compareTo(b.dateCreated?.time ?: 0L)
        }

        entries.take(limit).withIndex().collect { entry, idx ->
            String first = entry.user?.firstName ?: ''
            String lastInitial = entry.user?.lastName ? entry.user.lastName[0] + '.' : ''
            [
                    rank         : idx + 1,
                    species      : entry.species,
                    taille       : entry.taille,
                    poids        : entry.poids,
                    spot         : entry.spot,
                    bait         : entry.bait,
                    catchDate    : entry.catchDate,
                    angler       : "${first} ${lastInitial}".trim(),
            ]
        }
    }

    /**
     * Résumé du mois courant pour la homepage : top 3 toutes espèces
     * + quelques espèces phares.
     */
    Map currentMonthSummary() {
        LocalDate now = LocalDate.now()
        int y = now.year
        int m = now.monthValue

        [
                year  : y,
                month : m,
                period: String.format('%04d-%02d', y, m),
                overall: monthly(null, y, m, 5),
                species: [
                        truite : monthly('truite', y, m, 3),
                        carpe  : monthly('carpe', y, m, 3),
                        brochet: monthly('brochet', y, m, 3),
                ],
        ]
    }
}
