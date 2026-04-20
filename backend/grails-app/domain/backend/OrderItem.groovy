package backend

class OrderItem {

    String productId          // snapshot — product slug at time of order
    String productName
    String productSku
    String productBrand
    String productImageUrl
    BigDecimal unitPrice
    Integer qty

    static belongsTo = [order: CustomerOrder]

    static constraints = {
        productId blank: false, maxSize: 80
        productName blank: false, maxSize: 200
        productSku nullable: true, maxSize: 60
        productBrand nullable: true, maxSize: 120
        productImageUrl nullable: true, maxSize: 500
        unitPrice min: BigDecimal.ZERO
        qty min: 1
    }

    static mapping = {
        table 'order_items'
    }

    Map toApiMap() {
        [
                product: [
                        id      : productId,
                        name    : productName,
                        sku     : productSku,
                        brand   : productBrand,
                        imageUrl: productImageUrl,
                        price   : unitPrice,
                ],
                qty      : qty,
                unitPrice: unitPrice,
        ]
    }
}
