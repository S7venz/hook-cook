package backend

import grails.converters.JSON

class OrderController {

    static responseFormats = ['json']
    static allowedMethods = [
            myOrders   : 'GET',
            create     : 'POST',
            show       : 'GET',
            listAll    : 'GET',
            patchStatus: 'PATCH',
    ]

    AuthService authService
    OrderService orderService

    def myOrders() {
        User user = requireUser()
        if (!user) return
        render(orderService.ordersForUser(user).collect { it.toApiMap() } as JSON)
    }

    def show() {
        User user = requireUser()
        if (!user) return
        CustomerOrder order = orderService.findByReference(params.reference)
        if (!order) {
            response.status = 404
            render([error: 'Commande introuvable.'] as JSON)
            return
        }
        boolean isAdmin = user.role == 'ROLE_ADMIN'
        if (!isAdmin && order.user.id != user.id) {
            response.status = 403
            render([error: 'Commande non autorisée.'] as JSON)
            return
        }
        render(order.toApiMap() as JSON)
    }

    def create() {
        User user = requireUser()
        if (!user) return
        Map payload = request.JSON as Map
        Map result = orderService.createFromCart(user, payload ?: [:])
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        response.status = 201
        render(result.order.toApiMap() as JSON)
    }

    def listAll() {
        if (!requireAdmin()) return
        render(orderService.allOrders().collect { it.toApiMap() } as JSON)
    }

    def patchStatus() {
        if (!requireAdmin()) return
        Map payload = request.JSON as Map
        String status = payload?.status
        Map result = orderService.updateStatus(params.reference, status)
        if (result.error) {
            response.status = 400
            render([error: result.error] as JSON)
            return
        }
        render(result.order.toApiMap() as JSON)
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

    private boolean requireAdmin() {
        if (authService.isAdmin(request)) return true
        response.status = 403
        render([error: 'Accès réservé aux administrateurs.'] as JSON)
        false
    }
}
