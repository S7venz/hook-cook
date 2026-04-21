package backend

import grails.converters.JSON
import grails.gorm.transactions.Transactional

class ProductController {

    static responseFormats = ['json']
    static allowedMethods = [
            list     : 'GET',
            show     : 'GET',
            save     : 'POST',
            update   : 'PUT',
            remove   : 'DELETE',
            replenish: 'POST',
    ]

    AuthService authService
    StockAlertService stockAlertService

    def list() {
        // Pagination optionnelle — si ?page/?size absents, on renvoie la
        // liste complète (compat front existant). Sinon on pagine et on
        // expose le total via le header X-Total-Count.
        Integer page = params.int('page')
        Integer size = params.int('size')

        if (page != null || size != null) {
            int pageNum = Math.max(0, page ?: 0)
            int pageSize = Math.min(100, Math.max(1, size ?: 20))
            int offset = pageNum * pageSize
            long total = Product.count()
            List<Product> slice = Product.list(
                    sort: 'name', order: 'asc', max: pageSize, offset: offset,
            )
            response.setHeader('X-Total-Count', total.toString())
            response.setHeader('X-Page', pageNum.toString())
            response.setHeader('X-Page-Size', pageSize.toString())
            render(slice.collect { it.toApiMap() } as JSON)
            return
        }

        List<Product> all = Product.list(sort: 'name')
        render(all.collect { it.toApiMap() } as JSON)
    }

    def show() {
        Product product = Product.get(params.id)
        if (!product) {
            response.status = 404
            render([error: 'Produit introuvable.'] as JSON)
            return
        }
        render(product.toApiMap() as JSON)
    }

    @Transactional
    def save() {
        if (!requireAdmin()) return
        Map payload = request.JSON as Map
        if (!payload.id || !payload.name || !payload.sku || !payload.category) {
            response.status = 400
            render([error: 'Champs requis : id, sku, name, category.'] as JSON)
            return
        }
        if (Product.get(payload.id)) {
            response.status = 409
            render([error: 'Un produit existe déjà avec cet identifiant.'] as JSON)
            return
        }
        Product product = new Product()
        applyPayload(product, payload)
        if (!product.save(flush: true)) {
            response.status = 400
            render([error: firstError(product)] as JSON)
            return
        }
        response.status = 201
        render(product.toApiMap() as JSON)
    }

    @Transactional
    def update() {
        if (!requireAdmin()) return
        Product product = Product.get(params.id)
        if (!product) {
            response.status = 404
            render([error: 'Produit introuvable.'] as JSON)
            return
        }
        Map payload = request.JSON as Map
        applyPayload(product, payload)
        if (!product.save(flush: true)) {
            response.status = 400
            render([error: firstError(product)] as JSON)
            return
        }
        render(product.toApiMap() as JSON)
    }

    @Transactional
    def remove() {
        if (!requireAdmin()) return
        Product product = Product.get(params.id)
        if (!product) {
            response.status = 404
            render([error: 'Produit introuvable.'] as JSON)
            return
        }
        product.delete(flush: true)
        response.status = 204
        render('')
    }

    @Transactional
    def replenish() {
        if (!requireAdmin()) return
        Product product = Product.get(params.id)
        if (!product) {
            response.status = 404
            render([error: 'Produit introuvable.'] as JSON)
            return
        }
        Map payload = request.JSON as Map
        Integer qty = (payload?.qty ?: 0) as Integer
        if (qty <= 0) {
            response.status = 400
            render([error: 'Quantité invalide (doit être > 0).'] as JSON)
            return
        }
        int previousStock = product.stock ?: 0
        product.stock = previousStock + qty
        if (!product.save(flush: true)) {
            response.status = 400
            render([error: 'Mise à jour impossible.'] as JSON)
            return
        }
        // Notifie par email tous les users qui avaient souscrit à
        // l'alerte retour-en-stock pour ce produit.
        if (previousStock == 0 && product.stock > 0) {
            stockAlertService?.notifyReplenish(product.id)
        }
        render(product.toApiMap() as JSON)
    }

    private void applyPayload(Product product, Map payload) {
        // Only assign id on creation
        if (!product.id && payload.id) product.id = payload.id
        ['sku', 'name', 'category', 'technique', 'brand', 'water', 'img', 'imageUrl', 'description', 'story'].each { field ->
            if (payload.containsKey(field)) product[field] = payload[field]
        }
        if (payload.containsKey('lowStockThreshold')) {
            product.lowStockThreshold = payload.lowStockThreshold != null ?
                    (payload.lowStockThreshold as Integer) : null
        }
        if (payload.containsKey('price')) product.price = payload.price as BigDecimal
        if (payload.containsKey('wasPrice')) {
            product.wasPrice = payload.wasPrice != null ? payload.wasPrice as BigDecimal : null
        }
        if (payload.containsKey('stock')) product.stock = payload.stock as Integer
        if (payload.containsKey('rating')) {
            product.rating = payload.rating != null ? payload.rating as BigDecimal : null
        }
        if (payload.containsKey('reviews')) {
            product.reviews = payload.reviews != null ? payload.reviews as Integer : null
        }
        if (payload.containsKey('species')) {
            product.species = (payload.species as List)?.collect { it as String } ?: []
        }
        if (payload.containsKey('months')) {
            product.months = (payload.months as List)?.collect { it as Integer } ?: []
        }
        if (payload.containsKey('variants')) product.variants = payload.variants as Map
        if (payload.containsKey('specs')) product.specs = payload.specs as Map
    }

    private boolean requireAdmin() {
        if (authService.isAdmin(request)) return true
        response.status = 403
        render([error: 'Accès réservé aux administrateurs.'] as JSON)
        false
    }

    private String firstError(Product product) {
        def error = product.errors.allErrors[0]
        error ? "Validation : ${error.field ?: error.code}" : 'Données invalides.'
    }
}
