package backend

class CatchEntry {

    User user
    String species            // species id (e.g. "truite")
    Integer taille            // cm
    Integer poids             // grams (nullable)
    String spot
    String bait
    String weather
    String photoLabel
    String catchDate          // ISO date

    Date dateCreated
    Date lastUpdated

    static constraints = {
        user nullable: false
        species blank: false, maxSize: 40
        taille min: 0
        poids nullable: true, min: 0
        spot nullable: true, maxSize: 255
        bait nullable: true, maxSize: 255
        weather nullable: true, maxSize: 120
        photoLabel nullable: true, maxSize: 255
        catchDate blank: false, maxSize: 20
    }

    static mapping = {
        table 'catch_entries'
        user index: 'catch_entries_user_idx'
    }

    Map toApiMap() {
        [
                id      : id as String,
                date    : catchDate,
                species : species,
                taille  : taille,
                poids   : poids,
                spot    : spot,
                bait    : bait,
                weather : weather,
                photo   : photoLabel,
        ]
    }
}
