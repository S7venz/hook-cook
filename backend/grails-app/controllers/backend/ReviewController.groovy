package backend

import grails.converters.JSON

class ReviewController {

    static responseFormats = ['json']
    static allowedMethods = [
            list       : 'GET',
            create     : 'POST',
            remove     : 'DELETE',
            eligibility: 'GET',
    ]

    AuthService authService
    ReviewService reviewService

    def list() {
        String productId = params.productId
        if (!productId) {
            response.status = 400
            render([error: 'productId requis.'] as JSON)
            return
        }
        render(reviewService.forProduct(productId).collect { it.toApiMap() } as JSON)
    }

    def eligibility() {
        String productId = params.productId
        User user = currentUser()
        Map result = reviewService.eligibility(user, productId)
        render(result as JSON)
    }

    def create() {
        User user = requireUser()
        if (!user) return
        String productId = params.productId
        Map payload = request.JSON as Map
        Map result = reviewService.create(user, productId, payload ?: [:])
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        response.status = 201
        render(result.review.toApiMap() as JSON)
    }

    def remove() {
        User user = requireUser()
        if (!user) return
        Map result = reviewService.remove(user, params.id as Long)
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        response.status = 204
        render('')
    }

    private User currentUser() {
        Map check = authService.userFromRequest(request)
        check.user
    }

    private User requireUser() {
        User user = currentUser()
        if (!user) {
            response.status = 401
            render([error: 'Authentification requise.'] as JSON)
            return null
        }
        user
    }
}
