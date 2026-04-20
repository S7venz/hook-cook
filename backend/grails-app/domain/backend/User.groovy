package backend

class User {

    String email
    String passwordHash
    String firstName
    String lastName
    String phone
    String addressLine
    String postalCode
    String city
    String country
    String role = 'ROLE_USER'

    Date dateCreated
    Date lastUpdated

    static constraints = {
        email email: true, unique: true, blank: false, maxSize: 320
        passwordHash blank: false, maxSize: 255
        firstName blank: false, maxSize: 120
        lastName blank: false, maxSize: 120
        phone nullable: true, maxSize: 40
        addressLine nullable: true, maxSize: 255
        postalCode nullable: true, maxSize: 20
        city nullable: true, maxSize: 120
        country nullable: true, maxSize: 120
        role inList: ['ROLE_USER', 'ROLE_ADMIN']
    }

    Map toApiMap() {
        [
                id          : id,
                email       : email,
                firstName   : firstName,
                lastName    : lastName,
                role        : role,
                phone       : phone,
                addressLine : addressLine,
                postalCode  : postalCode,
                city        : city,
                country     : country,
        ]
    }

    static mapping = {
        table 'users'
        email index: 'users_email_idx'
    }
}
