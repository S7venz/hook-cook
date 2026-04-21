package backend

import grails.converters.JSON

class WishlistController {

    static responseFormats = ['json']
    static allowedMethods = [list: 'GET', add: 'POST', remove: 'DELETE']

    AuthService authService
    WishlistService wishlistService

    def list() {
        User user = requireUser()
        if (!user) return
        render(wishlistService.forUser(user).collect { it.toApiMap() } as JSON)
    }

    def add() {
        User user = requireUser()
        if (!user) return
        Map payload = request.JSON as Map
        String productId = (payload?.productId ?: '').toString()
        Map result = wishlistService.add(user, productId)
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        response.status = result.alreadyPresent ? 200 : 201
        render(result.item.toApiMap() as JSON)
    }

    def remove() {
        User user = requireUser()
        if (!user) return
        Map result = wishlistService.remove(user, params.productId)
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        response.status = 204
        render('')
    }

    private User requireUser() {
        Map check = authService.userFromRequest(request)
        if (!check.user) {
            response.status = 401
            render([error: 'Authentification requise.'] as JSON)
            return null
        }
        check.user
    }
}
