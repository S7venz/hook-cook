package backend

class Technique {

    String id                // slug, e.g. "mouche"
    String name

    static constraints = {
        id blank: false, maxSize: 40
        name blank: false, maxSize: 80
    }

    static mapping = {
        table 'techniques'
        id generator: 'assigned'
    }

    Map toApiMap() {
        [id: id, name: name]
    }
}
