package backend

class ContestRegistration {

    User user
    Contest contest
    String category           // hommes-exp | hommes-am | femmes | jeunes
    String permitNumber
    String status = 'paid'    // pending_payment | paid | payment_failed
    String stripePaymentIntentId

    Date dateCreated
    Date lastUpdated

    static constraints = {
        user nullable: false
        contest nullable: false
        category blank: false, maxSize: 40
        permitNumber nullable: true, maxSize: 40
        status inList: ['pending_payment', 'paid', 'payment_failed']
        stripePaymentIntentId nullable: true, maxSize: 80
    }

    static mapping = {
        table 'contest_registrations'
        user index: 'contest_reg_user_idx'
        contest index: 'contest_reg_contest_idx'
        stripePaymentIntentId index: 'contest_reg_stripe_pi_idx'
    }

    Map toApiMap() {
        [
                id                   : id,
                contestId            : contest?.id,
                contestTitle         : contest?.title,
                contestDate          : contest?.dateDisplay,
                category             : category,
                permitNumber         : permitNumber,
                status               : status,
                submittedAt          : dateCreated?.toInstant()?.toString(),
                stripePaymentIntentId: stripePaymentIntentId,
        ]
    }
}
