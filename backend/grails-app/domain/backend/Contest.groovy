package backend

class Contest {

    String id                // slug, e.g. "vesoul-2026-05"
    String title
    String date              // ISO date "2026-05-04"
    String dateDisplay       // "04 MAI"
    String lieu
    String distance
    String format
    BigDecimal price = BigDecimal.ZERO
    Integer inscrits = 0
    Integer max = 0
    String reglement
    String speciesCsv        // "truite,carpe"

    Date dateCreated
    Date lastUpdated

    static constraints = {
        id blank: false, maxSize: 80
        title blank: false, maxSize: 200
        date blank: false, maxSize: 20
        dateDisplay blank: false, maxSize: 20
        lieu blank: false, maxSize: 200
        distance nullable: true, maxSize: 20
        format nullable: true, maxSize: 120
        price min: BigDecimal.ZERO
        inscrits min: 0
        max min: 0
        reglement nullable: true, maxSize: 8000
        speciesCsv nullable: true, maxSize: 255
    }

    static mapping = {
        table 'contests'
        id generator: 'assigned'
        reglement type: 'text'
    }

    static transients = ['species']

    List<String> getSpecies() {
        speciesCsv ? speciesCsv.split(',').toList() : []
    }

    void setSpecies(List<String> list) {
        speciesCsv = list ? list.join(',') : null
    }

    Map toApiMap() {
        [
                id         : id,
                title      : title,
                date       : date,
                dateDisplay: dateDisplay,
                lieu       : lieu,
                distance   : distance,
                format     : format,
                prix       : price,
                inscrits   : inscrits,
                max        : max,
                reglement  : reglement,
                species    : getSpecies(),
        ]
    }
}
