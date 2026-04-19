package backend

class User {

    String email
    String passwordHash
    String firstName
    String lastName
    String role = 'ROLE_USER'

    Date dateCreated
    Date lastUpdated

    static constraints = {
        email email: true, unique: true, blank: false, maxSize: 320
        passwordHash blank: false, maxSize: 255
        firstName blank: false, maxSize: 120
        lastName blank: false, maxSize: 120
        role inList: ['ROLE_USER', 'ROLE_ADMIN']
    }

    static mapping = {
        table 'users'
        email index: 'users_email_idx'
    }
}
