package backend

class Species {

    String id                // slug, e.g. "truite"
    String name
    String latin
    String water
    String monthsCsv         // "3,4,5,6,7,8,9"

    static constraints = {
        id blank: false, maxSize: 40
        name blank: false, maxSize: 80
        latin nullable: true, maxSize: 120
        water nullable: true, maxSize: 40
        monthsCsv nullable: true, maxSize: 60
    }

    static mapping = {
        table 'species'
        id generator: 'assigned'
    }

    static transients = ['months']

    List<Integer> getMonths() {
        monthsCsv ? monthsCsv.split(',').collect { it.trim() as Integer } : []
    }

    void setMonths(List<Integer> list) {
        monthsCsv = list ? list.join(',') : null
    }

    Map toApiMap() {
        [id: id, name: name, latin: latin, water: water, months: getMonths()]
    }
}
