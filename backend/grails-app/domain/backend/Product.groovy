package backend

import groovy.json.JsonOutput
import groovy.json.JsonSlurper

class Product {

    String id                // slug, e.g. "hc-sauvage-9-5"
    String sku
    String name
    String category
    String technique
    BigDecimal price
    BigDecimal wasPrice
    Integer stock = 0
    BigDecimal rating
    Integer reviews
    String brand
    String water
    String img
    String imageUrl
    String description
    String story
    Integer lowStockThreshold = 15

    String speciesCsv        // "truite,ombre"
    String monthsCsv         // "3,4,5,6,7,8,9"
    String variantsJson      // JSON object
    String specsJson         // JSON object

    Date dateCreated
    Date lastUpdated

    static constraints = {
        id blank: false, maxSize: 80
        sku blank: false, maxSize: 60
        name blank: false, maxSize: 200
        category blank: false, maxSize: 40
        technique nullable: true, maxSize: 40
        price min: BigDecimal.ZERO
        wasPrice nullable: true, min: BigDecimal.ZERO
        stock min: 0
        rating nullable: true
        reviews nullable: true
        brand nullable: true, maxSize: 120
        water nullable: true, maxSize: 40
        img nullable: true, maxSize: 255
        imageUrl nullable: true, maxSize: 500
        description nullable: true, maxSize: 4000
        story nullable: true, maxSize: 8000
        speciesCsv nullable: true, maxSize: 255
        monthsCsv nullable: true, maxSize: 60
        variantsJson nullable: true, maxSize: 4000
        specsJson nullable: true, maxSize: 4000
        lowStockThreshold nullable: true, min: 0
    }

    static mapping = {
        table 'products'
        id generator: 'assigned'
        description type: 'text'
        story type: 'text'
        variantsJson type: 'text'
        specsJson type: 'text'
    }

    // Helper getters/setters — not persisted (backed by the *Csv / *Json columns).
    static transients = ['species', 'months', 'variants', 'specs']

    List<String> getSpecies() {
        speciesCsv ? speciesCsv.split(',').toList() : []
    }

    void setSpecies(List<String> list) {
        speciesCsv = list ? list.join(',') : null
    }

    List<Integer> getMonths() {
        monthsCsv ? monthsCsv.split(',').collect { it.trim() as Integer } : []
    }

    void setMonths(List<Integer> list) {
        monthsCsv = list ? list.join(',') : null
    }

    Map getVariants() {
        variantsJson ? (Map) new JsonSlurper().parseText(variantsJson) : null
    }

    void setVariants(Map map) {
        variantsJson = map ? JsonOutput.toJson(map) : null
    }

    Map getSpecs() {
        specsJson ? (Map) new JsonSlurper().parseText(specsJson) : null
    }

    void setSpecs(Map map) {
        specsJson = map ? JsonOutput.toJson(map) : null
    }

    Map toApiMap() {
        [
                id         : id,
                sku        : sku,
                name       : name,
                category   : category,
                technique  : technique,
                price      : price,
                wasPrice   : wasPrice,
                stock      : stock,
                rating     : rating,
                reviews    : reviews,
                brand      : brand,
                water      : water,
                img              : img,
                imageUrl         : imageUrl,
                description      : description,
                lowStockThreshold: lowStockThreshold,
                story      : story,
                species    : getSpecies(),
                months     : getMonths(),
                variants   : getVariants(),
                specs      : getSpecs(),
        ]
    }
}
