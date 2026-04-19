package backend

import grails.converters.JSON

class ReferenceController {

    static responseFormats = ['json']
    static allowedMethods = [
            categories: 'GET',
            techniques: 'GET',
            species   : 'GET',
            contests  : 'GET',
            contest   : 'GET',
    ]

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
}
