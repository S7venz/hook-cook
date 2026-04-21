package backend

import grails.converters.JSON
import grails.gorm.transactions.Transactional

class ReferenceController {

    static responseFormats = ['json']
    static allowedMethods = [
            categories      : 'GET',
            techniques      : 'GET',
            species         : 'GET',
            contests        : 'GET',
            contest         : 'GET',
            permitTypes     : 'GET',
            departments     : 'GET',
            createContest   : 'POST',
            updateContest   : 'PUT',
            deleteContest   : 'DELETE',
            createCategory  : 'POST',
            updateCategory  : 'PUT',
            deleteCategory  : 'DELETE',
            createTechnique : 'POST',
            updateTechnique : 'PUT',
            deleteTechnique : 'DELETE',
            createSpecies   : 'POST',
            updateSpecies   : 'PUT',
            deleteSpecies   : 'DELETE',
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

    def permitTypes() {
        render(PermitType.list(sort: 'price').collect { it.toApiMap() } as JSON)
    }

    def departments() {
        render(Department.list(sort: 'id').collect { it.toApiMap() } as JSON)
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

    @Transactional
    def createCategory() {
        if (!requireAdmin()) return
        Map payload = request.JSON as Map
        if (!payload.id || !payload.name) {
            response.status = 400
            render([error: 'Champs requis : id, name.'] as JSON)
            return
        }
        if (Category.get(payload.id)) {
            response.status = 409
            render([error: 'Catégorie déjà existante.'] as JSON)
            return
        }
        Category c = new Category(name: payload.name, displayCount: (payload.count ?: 0) as Integer)
        c.id = payload.id
        if (!c.save(flush: true)) {
            response.status = 400
            render([error: 'Validation échouée.'] as JSON)
            return
        }
        response.status = 201
        render(c.toApiMap() as JSON)
    }

    @Transactional
    def updateCategory() {
        if (!requireAdmin()) return
        Category c = Category.get(params.id)
        if (!c) {
            response.status = 404
            render([error: 'Catégorie introuvable.'] as JSON)
            return
        }
        Map payload = request.JSON as Map
        if (payload.containsKey('name')) c.name = payload.name
        if (payload.containsKey('count')) c.displayCount = payload.count as Integer
        if (!c.save(flush: true)) {
            response.status = 400
            render([error: 'Validation échouée.'] as JSON)
            return
        }
        render(c.toApiMap() as JSON)
    }

    @Transactional
    def deleteCategory() {
        if (!requireAdmin()) return
        Category c = Category.get(params.id)
        if (!c) {
            response.status = 404
            render([error: 'Catégorie introuvable.'] as JSON)
            return
        }
        c.delete(flush: true)
        response.status = 204
        render('')
    }

    @Transactional
    def createTechnique() {
        if (!requireAdmin()) return
        Map payload = request.JSON as Map
        if (!payload.id || !payload.name) {
            response.status = 400
            render([error: 'Champs requis : id, name.'] as JSON)
            return
        }
        if (Technique.get(payload.id)) {
            response.status = 409
            render([error: 'Technique déjà existante.'] as JSON)
            return
        }
        Technique t = new Technique(name: payload.name)
        t.id = payload.id
        if (!t.save(flush: true)) {
            response.status = 400
            render([error: 'Validation échouée.'] as JSON)
            return
        }
        response.status = 201
        render(t.toApiMap() as JSON)
    }

    @Transactional
    def updateTechnique() {
        if (!requireAdmin()) return
        Technique t = Technique.get(params.id)
        if (!t) {
            response.status = 404
            render([error: 'Technique introuvable.'] as JSON)
            return
        }
        Map payload = request.JSON as Map
        if (payload.containsKey('name')) t.name = payload.name
        if (!t.save(flush: true)) {
            response.status = 400
            render([error: 'Validation échouée.'] as JSON)
            return
        }
        render(t.toApiMap() as JSON)
    }

    @Transactional
    def deleteTechnique() {
        if (!requireAdmin()) return
        Technique t = Technique.get(params.id)
        if (!t) {
            response.status = 404
            render([error: 'Technique introuvable.'] as JSON)
            return
        }
        t.delete(flush: true)
        response.status = 204
        render('')
    }

    @Transactional
    def createSpecies() {
        if (!requireAdmin()) return
        Map payload = request.JSON as Map
        if (!payload.id || !payload.name) {
            response.status = 400
            render([error: 'Champs requis : id, name.'] as JSON)
            return
        }
        if (Species.get(payload.id)) {
            response.status = 409
            render([error: 'Espèce déjà existante.'] as JSON)
            return
        }
        Species s = new Species(
                name: payload.name,
                latin: payload.latin,
                water: payload.water,
                imageUrl: payload.imageUrl,
        )
        s.id = payload.id
        if (payload.months instanceof List) {
            s.months = (payload.months as List).collect { it as Integer }
        }
        if (!s.save(flush: true)) {
            response.status = 400
            render([error: 'Validation échouée.'] as JSON)
            return
        }
        response.status = 201
        render(s.toApiMap() as JSON)
    }

    @Transactional
    def updateSpecies() {
        if (!requireAdmin()) return
        Species s = Species.get(params.id)
        if (!s) {
            response.status = 404
            render([error: 'Espèce introuvable.'] as JSON)
            return
        }
        Map payload = request.JSON as Map
        ['name', 'latin', 'water', 'imageUrl'].each { field ->
            if (payload.containsKey(field)) s[field] = payload[field]
        }
        if (payload.months instanceof List) {
            s.months = (payload.months as List).collect { it as Integer }
        }
        if (!s.save(flush: true)) {
            response.status = 400
            render([error: 'Validation échouée.'] as JSON)
            return
        }
        render(s.toApiMap() as JSON)
    }

    @Transactional
    def deleteSpecies() {
        if (!requireAdmin()) return
        Species s = Species.get(params.id)
        if (!s) {
            response.status = 404
            render([error: 'Espèce introuvable.'] as JSON)
            return
        }
        s.delete(flush: true)
        response.status = 204
        render('')
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
