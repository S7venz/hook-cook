package backend

import grails.gorm.transactions.Transactional

import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle

@Transactional(readOnly = true)
class StatsService {

    private static final DateTimeFormatter MONTH_KEY = DateTimeFormatter.ofPattern('yyyy-MM')

    Map buildStats() {
        List<CustomerOrder> allOrders = CustomerOrder.list()
        List<Permit> allPermits = Permit.list()
        List<ContestRegistration> allRegistrations = ContestRegistration.list()

        Map stats = [
                revenueByMonth  : revenueByMonth(allOrders, 6),
                topProducts     : topProducts(5),
                ordersByStatus  : countsByField(allOrders, 'status'),
                permitsByStatus : countsByField(allPermits, 'status'),
                totalRevenue    : allOrders.sum { it.total ?: BigDecimal.ZERO } ?: BigDecimal.ZERO,
                totalOrders     : allOrders.size(),
                totalPermits    : allPermits.size(),
                totalRegistrations: allRegistrations.size(),
        ]
        stats
    }

    private List<Map> revenueByMonth(List<CustomerOrder> orders, int months) {
        LocalDate now = LocalDate.now()
        List<Map> buckets = (0..<months).collect { offset ->
            LocalDate d = now.minusMonths(months - 1 - offset)
            String key = d.format(MONTH_KEY)
            String label = d.month.getDisplayName(TextStyle.SHORT, Locale.FRENCH).toLowerCase()
            [key: key, label: "${label} ${d.year}" as String, total: BigDecimal.ZERO, count: 0]
        }
        Map byKey = buckets.collectEntries { [(it.key): it] }
        orders.each { order ->
            if (!order.dateCreated) return
            String key = order.dateCreated.toInstant().atZone(ZoneId.systemDefault())
                    .toLocalDate().format(MONTH_KEY)
            Map bucket = byKey[key]
            if (bucket) {
                bucket.total = (bucket.total as BigDecimal) + (order.total ?: BigDecimal.ZERO)
                bucket.count = (bucket.count as Integer) + 1
            }
        }
        buckets
    }

    private List<Map> topProducts(int limit) {
        // Aggregate qty and revenue from OrderItem
        Map<String, Map> agg = [:].withDefault { [qty: 0, revenue: BigDecimal.ZERO, name: null, sku: null] }
        OrderItem.list().each { item ->
            Map a = agg[item.productId]
            a.qty = (a.qty as Integer) + (item.qty ?: 0)
            a.revenue = (a.revenue as BigDecimal) + ((item.unitPrice ?: BigDecimal.ZERO) * (item.qty ?: 0))
            a.name = item.productName
            a.sku = item.productSku
        }
        agg.collect { id, data ->
            [productId: id, name: data.name, sku: data.sku, qty: data.qty, revenue: data.revenue]
        }.sort { -(it.qty as Integer) }.take(limit)
    }

    private Map<String, Integer> countsByField(List rows, String field) {
        Map<String, Integer> counts = [:]
        rows.each { row ->
            String key = row[field] as String ?: 'unknown'
            counts[key] = (counts[key] ?: 0) + 1
        }
        counts
    }
}
