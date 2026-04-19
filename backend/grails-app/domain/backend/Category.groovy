package backend

class Category {

    String id                // slug, e.g. "cannes"
    String name
    Integer displayCount = 0 // indicative count shown on the catalogue filter

    static constraints = {
        id blank: false, maxSize: 40
        name blank: false, maxSize: 80
        displayCount min: 0
    }

    static mapping = {
        table 'categories'
        id generator: 'assigned'
    }

    Map toApiMap() {
        [id: id, name: name, count: displayCount]
    }
}
