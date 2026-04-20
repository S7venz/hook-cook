package backend

import grails.converters.JSON
import grails.gorm.transactions.Transactional

class ReferenceController {

    static responseFormats = ['json']
    static allowedMethods = [
            categories   : 'GET',
            techniques   : 'GET',
            species      : 'GET',
            contests     : 'GET',
            contest      : 'GET',
            createContest: 'POST',
            updateContest: 'PUT',
            deleteContest: 'DELETE',
    ]

    AuthService authService

    def categories() {
        render(Category.list(sort: 'name').collect { it.toApiMap() } as JSON)
    }

    def techniques() {
        render(Technique.list(sort: 'name').collect { it.toApiMap() } as JSON)
    }

    def species() {
        render(Species.list(sort: 'name').collect { it.toApiMap() } as JSON)
    }

    def contests() {
        render(Contest.list(sort: 'date').collect { it.toApiMap() } as JSON)
    }

    def contest() {
        Contest contest = Contest.get(params.id)
        if (!contest) {
            response.status = 404
            render([error: 'Concours introuvable.'] as JSON)
            return
        }
        render(contest.toApiMap() as JSON)
    }

    @Transactional
    def createContest() {
        if (!requireAdmin()) return
        Map payload = request.JSON as Map
        if (!payload.id || !payload.title || !payload.date || !payload.dateDisplay || !payload.lieu) {
            response.status = 400
            render([error: 'Champs requis : id, title, date, dateDisplay, lieu.'] as JSON)
            return
        }
        if (Contest.get(payload.id)) {
            response.status = 409
            render([error: 'Un concours existe déjà avec cet identifiant.'] as JSON)
            return
        }
        Contest contest = new Contest()
        applyContestPayload(contest, payload)
        contest.id = payload.id
        if (!contest.save(flush: true)) {
            response.status = 400
            render([error: firstError(contest)] as JSON)
            return
        }
        response.status = 201
        render(contest.toApiMap() as JSON)
    }

    @Transactional
    def updateContest() {
        if (!requireAdmin()) return
        Contest contest = Contest.get(params.id)
        if (!contest) {
            response.status = 404
            render([error: 'Concours introuvable.'] as JSON)
            return
        }
        Map payload = request.JSON as Map
        applyContestPayload(contest, payload)
        if (!contest.save(flush: true)) {
            response.status = 400
            render([error: firstError(contest)] as JSON)
            return
        }
        render(contest.toApiMap() as JSON)
    }

    @Transactional
    def deleteContest() {
        if (!requireAdmin()) return
        Contest contest = Contest.get(params.id)
        if (!contest) {
            response.status = 404
            render([error: 'Concours introuvable.'] as JSON)
            return
        }
        ContestRegistration.findAllByContest(contest)*.delete()
        contest.delete(flush: true)
        response.status = 204
        render('')
    }

    private void applyContestPayload(Contest contest, Map payload) {
        ['title', 'date', 'dateDisplay', 'lieu', 'distance', 'format', 'reglement'].each { field ->
            if (payload.containsKey(field)) contest[field] = payload[field]
        }
        if (payload.containsKey('prix')) contest.price = payload.prix as BigDecimal
        if (payload.containsKey('price')) contest.price = payload.price as BigDecimal
        if (payload.containsKey('inscrits')) contest.inscrits = payload.inscrits as Integer
        if (payload.containsKey('max')) contest.max = payload.max as Integer
        if (payload.containsKey('species')) {
            contest.species = (payload.species as List)?.collect { it as String } ?: []
        }
    }

    private boolean requireAdmin() {
        if (authService.isAdmin(request)) return true
        response.status = 403
        render([error: 'Accès réservé aux administrateurs.'] as JSON)
        false
    }

    private String firstError(Contest contest) {
        def error = contest.errors.allErrors[0]
        error ? "Validation : ${error.field ?: error.code}" : 'Données invalides.'
    }
}
