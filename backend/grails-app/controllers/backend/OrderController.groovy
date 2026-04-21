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
            invoice    : 'GET',
    ]

    AuthService authService
    OrderService orderService
    InvoiceService invoiceService

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
        Integer page = params.int('page')
        Integer size = params.int('size')
        if (page != null || size != null) {
            int pageNum = Math.max(0, page ?: 0)
            int pageSize = Math.min(100, Math.max(1, size ?: 20))
            int offset = pageNum * pageSize
            long total = CustomerOrder.count()
            List slice = CustomerOrder.list(
                    sort: 'dateCreated', order: 'desc', max: pageSize, offset: offset,
            )
            response.setHeader('X-Total-Count', total.toString())
            response.setHeader('X-Page', pageNum.toString())
            response.setHeader('X-Page-Size', pageSize.toString())
            render(slice.collect { it.toApiMap() } as JSON)
            return
        }
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

    def invoice() {
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
            render([error: 'Facture non autorisée.'] as JSON)
            return
        }
        byte[] pdf = invoiceService.renderPdf(order)
        response.contentType = 'application/pdf'
        response.setHeader(
                'Content-Disposition',
                "attachment; filename=\"facture-${order.reference}.pdf\""
        )
        response.contentLength = pdf.length
        response.outputStream.withStream { out ->
            out.write(pdf)
            out.flush()
        }
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
