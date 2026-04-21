package backend

class Department {

    String id                // department code, e.g. "66"
    String name              // "66 — Pyrénées-Orientales"

    static constraints = {
        id blank: false, maxSize: 4
        name blank: false, maxSize: 120
    }

    static mapping = {
        table 'departments'
        id generator: 'assigned'
    }

    Map toApiMap() {
        [code: id, name: name]
    }
}
