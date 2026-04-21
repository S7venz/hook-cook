package backend

class UrlMappings {

    static mappings = {
        post "/api/auth/register"(controller: 'auth', action: 'register')
        post "/api/auth/login"(controller: 'auth', action: 'login')
        get "/api/auth/me"(controller: 'auth', action: 'me')
        patch "/api/auth/me"(controller: 'auth', action: 'updateMe')

        get "/api/products"(controller: 'product', action: 'list')
        post "/api/products"(controller: 'product', action: 'save')
        get "/api/products/$id"(controller: 'product', action: 'show')
        put "/api/products/$id"(controller: 'product', action: 'update')
        delete "/api/products/$id"(controller: 'product', action: 'remove')
        post "/api/products/$id/replenish"(controller: 'product', action: 'replenish')

        get "/api/categories"(controller: 'reference', action: 'categories')
        post "/api/categories"(controller: 'reference', action: 'createCategory')
        put "/api/categories/$id"(controller: 'reference', action: 'updateCategory')
        delete "/api/categories/$id"(controller: 'reference', action: 'deleteCategory')
        get "/api/techniques"(controller: 'reference', action: 'techniques')
        post "/api/techniques"(controller: 'reference', action: 'createTechnique')
        put "/api/techniques/$id"(controller: 'reference', action: 'updateTechnique')
        delete "/api/techniques/$id"(controller: 'reference', action: 'deleteTechnique')
        get "/api/species"(controller: 'reference', action: 'species')
        post "/api/species"(controller: 'reference', action: 'createSpecies')
        put "/api/species/$id"(controller: 'reference', action: 'updateSpecies')
        delete "/api/species/$id"(controller: 'reference', action: 'deleteSpecies')
        get "/api/contests"(controller: 'reference', action: 'contests')
        post "/api/contests"(controller: 'reference', action: 'createContest')
        get "/api/contests/$id"(controller: 'reference', action: 'contest')
        put "/api/contests/$id"(controller: 'reference', action: 'updateContest')
        delete "/api/contests/$id"(controller: 'reference', action: 'deleteContest')

        get "/api/orders/me"(controller: 'order', action: 'myOrders')
        post "/api/orders"(controller: 'order', action: 'create')
        get "/api/orders"(controller: 'order', action: 'listAll')
        get "/api/orders/$reference"(controller: 'order', action: 'show')
        patch "/api/orders/$reference"(controller: 'order', action: 'patchStatus')
        get "/api/orders/$reference/invoice"(controller: 'order', action: 'invoice')

        get "/api/permits/me"(controller: 'permit', action: 'current')
        post "/api/permits"(controller: 'permit', action: 'create')
        get "/api/permits"(controller: 'permit', action: 'listAll')
        patch "/api/permits/$reference"(controller: 'permit', action: 'patchStatus')
        get "/api/permit-types"(controller: 'reference', action: 'permitTypes')
        get "/api/departments"(controller: 'reference', action: 'departments')

        post "/api/contests/$id/register"(controller: 'contestRegistration', action: 'register')
        get "/api/contests-registrations/me"(controller: 'contestRegistration', action: 'myList')
        get "/api/contests-registrations"(controller: 'contestRegistration', action: 'listAll')

        get "/api/carnet"(controller: 'carnet', action: 'list')
        post "/api/carnet"(controller: 'carnet', action: 'create')
        delete "/api/carnet/$id"(controller: 'carnet', action: 'remove')

        post "/api/uploads"(controller: 'upload', action: 'upload')
        get "/api/uploads/$filename"(controller: 'upload', action: 'serve')

        get "/api/admin/stats"(controller: 'stats', action: 'overview')

        get "/api/products/$productId/reviews"(controller: 'review', action: 'list')
        post "/api/products/$productId/reviews"(controller: 'review', action: 'create')
        get "/api/products/$productId/reviews/eligibility"(controller: 'review', action: 'eligibility')
        delete "/api/reviews/$id"(controller: 'review', action: 'remove')

        get "/api/wishlist"(controller: 'wishlist', action: 'list')
        post "/api/wishlist"(controller: 'wishlist', action: 'add')
        delete "/api/wishlist/$productId"(controller: 'wishlist', action: 'remove')

        get "/api/stock-alerts"(controller: 'stockAlert', action: 'list')
        post "/api/products/$productId/stock-alerts"(controller: 'stockAlert', action: 'subscribe')

        get "/api/admin/exports/orders.csv"(controller: 'export', action: 'orders')
        get "/api/admin/exports/permits.csv"(controller: 'export', action: 'permits')
        get "/api/admin/exports/contest-registrations.csv"(controller: 'export', action: 'contestRegistrations')

        get "/api/leaderboard/monthly"(controller: 'leaderboard', action: 'monthly')
        get "/api/leaderboard/summary"(controller: 'leaderboard', action: 'summary')

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
