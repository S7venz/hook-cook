package backend

class CustomerOrder {

    String reference          // e.g. "HC-2186-1234"
    User user
    BigDecimal subtotal
    BigDecimal shipping
    BigDecimal total
    String email
    String addressLine
    String postalCode
    String city
    String shippingMode       // "Standard Colissimo", "Chronopost 24h", "Point relais"
    String status             // paid | shipped | delivered | cancelled
    String statusLabel

    Date dateCreated
    Date lastUpdated

    static hasMany = [items: OrderItem]

    static constraints = {
        reference blank: false, unique: true, maxSize: 40
        user nullable: false
        subtotal min: BigDecimal.ZERO
        shipping min: BigDecimal.ZERO
        total min: BigDecimal.ZERO
        email blank: false, maxSize: 320
        addressLine blank: false, maxSize: 255
        postalCode blank: false, maxSize: 20
        city blank: false, maxSize: 120
        shippingMode blank: false, maxSize: 80
        status inList: ['paid', 'shipped', 'delivered', 'cancelled']
        statusLabel blank: false, maxSize: 40
    }

    static mapping = {
        table 'orders'
        reference index: 'orders_reference_idx'
        user index: 'orders_user_idx'
    }

    Map toApiMap() {
        [
                id          : reference,
                date        : dateCreated?.toInstant()?.toString(),
                email       : email,
                subtotal    : subtotal,
                shipping    : shipping,
                total       : total,
                status      : status,
                statusLabel : statusLabel,
                shippingMode: shippingMode,
                address     : [line: addressLine, postal: postalCode, city: city],
                items       : (items ?: []).collect { it.toApiMap() },
        ]
    }
}
