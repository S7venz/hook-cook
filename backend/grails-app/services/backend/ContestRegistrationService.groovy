package backend

import grails.gorm.transactions.Transactional

@Transactional
class ContestRegistrationService {

    Map register(User user, String contestId, Map payload) {
        if (!user) return [error: 'Authentification requise.']
        Contest contest = Contest.get(contestId)
        if (!contest) return [error: 'Concours introuvable.']
        if (ContestRegistration.findByUserAndContest(user, contest)) {
            return [error: 'Vous êtes déjà inscrit à ce concours.']
        }
        ContestRegistration reg = new ContestRegistration(
                user: user,
                contest: contest,
                category: payload.category ?: 'hommes-am',
                permitNumber: payload.permitNumber,
        )
        if (!reg.save(flush: true)) {
            return [error: 'Inscription impossible.']
        }
        contest.inscrits = (contest.inscrits ?: 0) + 1
        contest.save(flush: true)
        [registration: reg]
    }

    List<ContestRegistration> forUser(User user) {
        ContestRegistration.findAllByUser(user, [sort: 'dateCreated', order: 'desc'])
    }

    List<ContestRegistration> all() {
        ContestRegistration.list(sort: 'dateCreated', order: 'desc')
    }
}
