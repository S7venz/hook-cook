package backend

import groovy.json.JsonOutput
import groovy.json.JsonSlurper

class PermitType {

    String id                // slug, e.g. "annuel"
    String title             // "Permis annuel"
    String label             // "Le plus choisi", "Vacances", "-12 ans"
    BigDecimal price
    String itemsJson         // JSON array of bullet strings

    static constraints = {
        id blank: false, maxSize: 40
        title blank: false, maxSize: 80
        label nullable: true, maxSize: 40
        price min: BigDecimal.ZERO
        itemsJson nullable: true, maxSize: 2000
    }

    static mapping = {
        table 'permit_types'
        id generator: 'assigned'
        itemsJson type: 'text'
    }

    static transients = ['items']

    List<String> getItems() {
        itemsJson ? (List) new JsonSlurper().parseText(itemsJson) : []
    }

    void setItems(List<String> list) {
        itemsJson = list ? JsonOutput.toJson(list) : null
    }

    Map toApiMap() {
        [id: id, title: title, label: label, price: price, items: getItems()]
    }
}
