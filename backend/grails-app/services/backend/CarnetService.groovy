package backend

import grails.gorm.transactions.Transactional

@Transactional
class CarnetService {

    Map create(User user, Map payload) {
        if (!user) return [error: 'Authentification requise.']
        if (!payload.species || !payload.taille || !payload.spot) {
            return [error: 'Espèce, taille et lieu requis.']
        }
        CatchEntry entry = new CatchEntry(
                user      : user,
                species   : payload.species as String,
                taille    : payload.taille as Integer,
                poids     : payload.poids ? payload.poids as Integer : null,
                spot      : payload.spot as String,
                bait      : payload.bait as String,
                weather   : payload.weather as String,
                photoLabel: payload.photo as String,
                catchDate : (payload.date ?: new Date().toString()) as String,
        )
        if (!entry.save(flush: true)) {
            return [error: 'Enregistrement impossible.']
        }
        [entry: entry]
    }

    List<CatchEntry> forUser(User user) {
        CatchEntry.findAllByUser(user, [sort: 'catchDate', order: 'desc'])
    }

    Map remove(User user, Long id) {
        CatchEntry entry = CatchEntry.get(id)
        if (!entry) return [error: 'Prise introuvable.']
        if (entry.user.id != user.id && user.role != 'ROLE_ADMIN') {
            return [error: 'Suppression non autorisée.']
        }
        entry.delete(flush: true)
        [ok: true]
    }
}
