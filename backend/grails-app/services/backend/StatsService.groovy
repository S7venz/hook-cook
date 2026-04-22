package backend

import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle

// Pas de @Transactional : ce service ne fait que des lectures (meme
// pattern que LeaderboardService/ExportService). Le wrapper
// transactionnel interfere avec DataTest en masquant les entites
// saved dans les tests.
class StatsService {

    private static final DateTimeFormatter MONTH_KEY = DateTimeFormatter.ofPattern('yyyy-MM')

    Map buildStats() {
        List<CustomerOrder> allOrders = CustomerOrder.list()
        List<Permit> allPermits = Permit.list()
        List<ContestRegistration> allRegistrations = ContestRegistration.list()
        List<Product> allProducts = Product.list()
        List<User> allUsers = User.list()

        // KPIs agrégés — on exclut pending/payment_failed du chiffre d'affaires
        // (commandes en cours de paiement, le PaymentIntent peut encore échouer)
        List<CustomerOrder> paidPlus = allOrders.findAll {
            it.status in ['paid', 'shipped', 'delivered']
        }
        BigDecimal revenue = paidPlus.sum { it.total ?: BigDecimal.ZERO } ?: BigDecimal.ZERO
        BigDecimal avgBasket = paidPlus.isEmpty() ? BigDecimal.ZERO :
                (revenue / paidPlus.size()).setScale(2, BigDecimal.ROUND_HALF_UP)
        Integer pendingCount = allOrders.count { it.status == 'pending' } as Integer
        Integer paymentFailedCount = allOrders.count { it.status == 'payment_failed' } as Integer

        // Taux de conversion : commandes / users (brut — on n'a pas
        // d'analytics de visites pour l'instant). Proxy utile quand
        // même : % d'utilisateurs qui ont acheté au moins une fois.
        Set<Long> buyerIds = paidPlus.collect { it.user?.id }.findAll().toSet()
        BigDecimal conversionRate = allUsers.isEmpty() ? BigDecimal.ZERO :
                ((buyerIds.size() * 100.0 / allUsers.size()) as BigDecimal)
                        .setScale(1, BigDecimal.ROUND_HALF_UP)

        // Stocks critiques : produits sous le seuil lowStockThreshold
        List<Map> lowStock = allProducts.findAll { p ->
            (p.stock ?: 0) <= (p.lowStockThreshold ?: 15)
        }.sort { (it.stock ?: 0) }.take(8).collect { p ->
            [id: p.id, name: p.name, stock: p.stock, threshold: p.lowStockThreshold, category: p.category]
        }

        // Produits jamais vendus (ceux qui n'apparaissent dans aucun order_item)
        Set<String> soldIds = OrderItem.list().collect { it.productId }.findAll().toSet()
        List<Map> neverSold = allProducts.findAll { !soldIds.contains(it.id) }
                .sort { (it.stock ?: 0) }.reverse() // ceux qui traînent le plus
                .take(6)
                .collect { p ->
                    [id: p.id, name: p.name, stock: p.stock, price: p.price, category: p.category]
                }

        // Ventes par catégorie — aggrégation à partir d'OrderItem + Product
        Map<String, BigDecimal> revenueByCategory = [:]
        OrderItem.list().each { item ->
            Product p = Product.get(item.productId)
            if (!p || !p.category) return
            BigDecimal line = (item.unitPrice ?: BigDecimal.ZERO) * (item.qty ?: 0)
            revenueByCategory[p.category] =
                    (revenueByCategory[p.category] ?: BigDecimal.ZERO) + line
        }
        List<Map> categoryRevenue = revenueByCategory.collect { cat, rev ->
            [category: cat, revenue: rev.setScale(2, BigDecimal.ROUND_HALF_UP)]
        }.sort { -(it.revenue as BigDecimal) }

        // Nouveaux users par mois sur les 6 derniers mois
        List<Map> newUsersByMonth = newUsersTimeline(allUsers, 6)

        [
                revenueByMonth     : revenueByMonth(allOrders, 6),
                newUsersByMonth    : newUsersByMonth,
                topProducts        : topProducts(5),
                ordersByStatus     : countsByField(allOrders, 'status'),
                permitsByStatus    : countsByField(allPermits, 'status'),
                totalRevenue       : revenue,
                totalOrders        : allOrders.size(),
                totalPermits       : allPermits.size(),
                totalRegistrations : allRegistrations.size(),
                totalUsers         : allUsers.size(),
                totalBuyers        : buyerIds.size(),
                pendingOrders      : pendingCount,
                paymentFailedOrders: paymentFailedCount,
                // Nouveaux KPIs enrichis
                avgBasket          : avgBasket,
                conversionRate     : conversionRate,
                lowStock           : lowStock,
                neverSold          : neverSold,
                categoryRevenue    : categoryRevenue,
        ]
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

    private List<Map> newUsersTimeline(List<User> users, int months) {
        LocalDate now = LocalDate.now()
        List<Map> buckets = (0..<months).collect { offset ->
            LocalDate d = now.minusMonths(months - 1 - offset)
            [key: d.format(MONTH_KEY),
             label: d.month.getDisplayName(TextStyle.SHORT, Locale.FRENCH).toLowerCase() + ' ' + d.year,
             count: 0]
        }
        Map byKey = buckets.collectEntries { [(it.key): it] }
        users.each { u ->
            if (!u.dateCreated) return
            String key = u.dateCreated.toInstant().atZone(ZoneId.systemDefault())
                    .toLocalDate().format(MONTH_KEY)
            Map b = byKey[key]
            if (b) b.count = (b.count as Integer) + 1
        }
        buckets
    }

    private List<Map> topProducts(int limit) {
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
