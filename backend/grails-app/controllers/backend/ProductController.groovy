package backend

import grails.converters.JSON

class ProductController {

    static responseFormats = ['json']
    static allowedMethods = [list: 'GET', show: 'GET']

    def list() {
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
}
