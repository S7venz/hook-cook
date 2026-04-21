package backend

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import spock.lang.Specification

class ExportServiceSpec extends Specification
        implements ServiceUnitTest<ExportService>, DataTest {

    void setupSpec() {
        mockDomains User, CustomerOrder, OrderItem, Permit, Contest, ContestRegistration
    }

    User buildUser() {
        new User(email: 'u@x.fr', passwordHash: 'h', firstName: 'Alice', lastName: 'Martin')
                .save(failOnError: true, validate: false)
    }

    void "ordersCsv commence par le BOM UTF-8 et un header cohérent"() {
        when:
        String csv = service.ordersCsv()

        then:
        csv.startsWith('\uFEFF')
        csv.split('\r\n')[0].contains('Référence;Date;Statut;Client email')
    }

    void "ordersCsv émet les données séparées par ;"() {
        given:
        User u = buildUser()
        CustomerOrder o = new CustomerOrder(
                reference: 'HC-TEST-001', user: u,
                subtotal: new BigDecimal('100.00'),
                shipping: new BigDecimal('5.90'),
                total: new BigDecimal('105.90'),
                email: u.email, addressLine: '1 rue', postalCode: '66000',
                city: 'Perpignan', shippingMode: 'Colissimo',
                status: 'paid', statusLabel: 'Payée',
        )
        o.save(failOnError: true, validate: false)

        when:
        String csv = service.ordersCsv()
        String[] lines = csv.split('\r\n')
        String dataRow = lines.find { it.contains('HC-TEST-001') }

        then:
        dataRow != null
        dataRow.contains('HC-TEST-001')
        dataRow.contains('u@x.fr')
        dataRow.contains('Alice')
        dataRow.contains('Martin')
        // Totaux formatés avec virgule décimale française
        dataRow.contains('100,00')
        dataRow.contains('5,90')
        dataRow.contains('105,90')
        // Le séparateur est bien `;`
        dataRow.count(';') >= 10
    }

    void "l'échappement CSV entoure de guillemets les champs contenant ; ou saut de ligne"() {
        given:
        User u = buildUser()
        CustomerOrder o = new CustomerOrder(
                reference: 'HC-X', user: u,
                subtotal: new BigDecimal('10.00'),
                shipping: new BigDecimal('0.00'),
                total: new BigDecimal('10.00'),
                email: u.email,
                addressLine: 'Rue du ; point virgule', // contient un ;
                postalCode: '66000', city: 'Perpignan',
                shippingMode: 'Colissimo',
                status: 'paid', statusLabel: 'Payée',
        )
        o.save(failOnError: true, validate: false)

        when:
        String csv = service.ordersCsv()

        then:
        csv.contains('"Rue du ; point virgule"')
    }

    void "permitsCsv renvoie un header même sans données"() {
        when:
        String csv = service.permitsCsv()

        then:
        csv.startsWith('\uFEFF')
        csv.split('\r\n')[0].contains('Référence;Date dépôt;Statut')
    }
}
