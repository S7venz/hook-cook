package backend

class UrlMappings {

    static mappings = {
        post "/api/auth/register"(controller: 'auth', action: 'register')
        post "/api/auth/login"(controller: 'auth', action: 'login')
        get "/api/auth/me"(controller: 'auth', action: 'me')

        get "/api/products"(controller: 'product', action: 'list')
        post "/api/products"(controller: 'product', action: 'save')
        get "/api/products/$id"(controller: 'product', action: 'show')
        put "/api/products/$id"(controller: 'product', action: 'update')
        delete "/api/products/$id"(controller: 'product', action: 'remove')

        get "/api/categories"(controller: 'reference', action: 'categories')
        get "/api/techniques"(controller: 'reference', action: 'techniques')
        get "/api/species"(controller: 'reference', action: 'species')
        get "/api/contests"(controller: 'reference', action: 'contests')
        get "/api/contests/$id"(controller: 'reference', action: 'contest')

        get "/api/orders/me"(controller: 'order', action: 'myOrders')
        post "/api/orders"(controller: 'order', action: 'create')
        get "/api/orders"(controller: 'order', action: 'listAll')
        get "/api/orders/$reference"(controller: 'order', action: 'show')
        patch "/api/orders/$reference"(controller: 'order', action: 'patchStatus')

        get "/api/permits/me"(controller: 'permit', action: 'current')
        post "/api/permits"(controller: 'permit', action: 'create')
        get "/api/permits"(controller: 'permit', action: 'listAll')
        patch "/api/permits/$reference"(controller: 'permit', action: 'patchStatus')

        delete "/$controller/$id(.$format)?"(action:"delete")
        get "/$controller(.$format)?"(action:"index")
        get "/$controller/$id(.$format)?"(action:"show")
        post "/$controller(.$format)?"(action:"save")
        put "/$controller/$id(.$format)?"(action:"update")
        patch "/$controller/$id(.$format)?"(action:"patch")

        "/"(controller: 'application', action:'index')
        "500"(view: '/error')
        "404"(view: '/notFound')
    }
}
