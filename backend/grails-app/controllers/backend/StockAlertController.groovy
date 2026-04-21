package backend

import grails.converters.JSON

class StockAlertController {

    static responseFormats = ['json']
    static allowedMethods = [list: 'GET', subscribe: 'POST']

    AuthService authService
    StockAlertService stockAlertService

    def list() {
        User user = requireUser()
        if (!user) return
        render(stockAlertService.forUser(user).collect { it.toApiMap() } as JSON)
    }

    def subscribe() {
        User user = requireUser()
        if (!user) return
        String productId = params.productId
        Map result = stockAlertService.subscribe(user, productId)
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        response.status = result.alreadyPresent ? 200 : 201
        render(result.alert.toApiMap() as JSON)
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
