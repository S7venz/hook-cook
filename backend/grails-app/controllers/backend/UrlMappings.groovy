package backend

class UrlMappings {

    static mappings = {
        post "/api/auth/register"(controller: 'auth', action: 'register')
        post "/api/auth/login"(controller: 'auth', action: 'login')
        get "/api/auth/me"(controller: 'auth', action: 'me')

        get "/api/products"(controller: 'product', action: 'list')
        get "/api/products/$id"(controller: 'product', action: 'show')

        get "/api/categories"(controller: 'reference', action: 'categories')
        get "/api/techniques"(controller: 'reference', action: 'techniques')
        get "/api/species"(controller: 'reference', action: 'species')
        get "/api/contests"(controller: 'reference', action: 'contests')
        get "/api/contests/$id"(controller: 'reference', action: 'contest')

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
