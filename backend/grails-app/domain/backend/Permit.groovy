package backend

import groovy.json.JsonOutput
import groovy.json.JsonSlurper

class Permit {

    String reference          // e.g. "FR-2026-48291"
    User user
    String typeId             // annuel | semaine | decouverte
    String typeTitle
    BigDecimal amount
    String department
    String firstName
    String lastName
    String birthDate
    String status             // pending_payment | pending | approved | rejected | payment_failed
    String statusLabel
    String historyJson        // serialized list of steps
    String idDocUrl           // URL of uploaded ID document
    String photoDocUrl        // URL of uploaded ID photo
    String stripePaymentIntentId

    Date dateCreated
    Date lastUpdated

    static constraints = {
        reference blank: false, unique: true, maxSize: 40
        user nullable: false
        typeId blank: false, maxSize: 40
        typeTitle blank: false, maxSize: 80
        amount min: BigDecimal.ZERO
        department blank: false, maxSize: 80
        firstName blank: false, maxSize: 120
        lastName blank: false, maxSize: 120
        birthDate blank: false, maxSize: 20
        status inList: ['pending_payment', 'pending', 'approved', 'rejected', 'payment_failed']
        statusLabel blank: false, maxSize: 40
        historyJson nullable: true, maxSize: 4000
        idDocUrl nullable: true, maxSize: 500
        photoDocUrl nullable: true, maxSize: 500
        stripePaymentIntentId nullable: true, maxSize: 80
    }

    static mapping = {
        table 'permits'
        reference index: 'permits_reference_idx'
        user index: 'permits_user_idx'
        historyJson type: 'text'
        stripePaymentIntentId index: 'permits_stripe_pi_idx'
    }

    static transients = ['history']

    List<Map> getHistory() {
        historyJson ? (List) new JsonSlurper().parseText(historyJson) : []
    }

    void setHistory(List<Map> steps) {
        historyJson = steps ? JsonOutput.toJson(steps) : null
    }

    Map toApiMap() {
        [
                id                   : reference,
                typeId               : typeId,
                typeTitle            : typeTitle,
                amount               : amount,
                department           : department,
                firstName            : firstName,
                lastName             : lastName,
                birthDate            : birthDate,
                status               : status,
                statusLabel          : statusLabel,
                submittedAt          : dateCreated?.toInstant()?.toString(),
                history              : getHistory(),
                idDocUrl             : idDocUrl,
                photoDocUrl          : photoDocUrl,
                stripePaymentIntentId: stripePaymentIntentId,
        ]
    }
}
