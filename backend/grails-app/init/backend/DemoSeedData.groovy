package backend

import groovy.json.JsonOutput
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

/**
 * Injection de données de démonstration — 10 utilisateurs avec
 * historique réaliste (commandes, permis, inscriptions concours,
 * avis, carnet, favoris, alertes stock).
 *
 * Toutes les données sont idempotentes : si l'utilisateur
 * "marie.dupont@demo.hookcook.fr" existe déjà, le seed n'est pas
 * rejoué. Chaque user démo a le mot de passe "demo1234".
 *
 * Activé par la variable d'environnement HC_SEED_DEMO=true dans .env,
 * sinon ignoré (on ne veut pas de données fictives en prod).
 */
class DemoSeedData {

    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder(12)

    static final List<Map> DEMO_USERS = [
            [firstName: 'Marie', lastName: 'Dupont', email: 'marie.dupont@demo.hookcook.fr',
             phone: '0612340011', address: '12 avenue de la Gare', postal: '66000', city: 'Perpignan'],
            [firstName: 'Paul', lastName: 'Gauthier', email: 'paul.gauthier@demo.hookcook.fr',
             phone: '0612340022', address: '5 rue de la Plage', postal: '66190', city: 'Collioure'],
            [firstName: 'Sophie', lastName: 'Lefebvre', email: 'sophie.lefebvre@demo.hookcook.fr',
             phone: '0612340033', address: '22 rue des Cerisiers', postal: '66700', city: 'Argelès-sur-Mer'],
            [firstName: 'Julien', lastName: 'Bernard', email: 'julien.bernard@demo.hookcook.fr',
             phone: '0612340044', address: '8 impasse du Tech', postal: '66400', city: 'Céret'],
            [firstName: 'Camille', lastName: 'Roux', email: 'camille.roux@demo.hookcook.fr',
             phone: '0612340055', address: '3 place de la République', postal: '66500', city: 'Prades'],
            [firstName: 'Antoine', lastName: 'Moreau', email: 'antoine.moreau@demo.hookcook.fr',
             phone: '0612340066', address: '17 boulevard Louis Blazy', postal: '66600', city: 'Rivesaltes'],
            [firstName: 'Léa', lastName: 'Petit', email: 'lea.petit@demo.hookcook.fr',
             phone: '0612340077', address: '9 rue du Château', postal: '66650', city: 'Banyuls-sur-Mer'],
            [firstName: 'Thomas', lastName: 'Lambert', email: 'thomas.lambert@demo.hookcook.fr',
             phone: '0612340088', address: '45 rue Haute', postal: '66230', city: 'Prats-de-Mollo'],
            [firstName: 'Emma', lastName: 'Durand', email: 'emma.durand@demo.hookcook.fr',
             phone: '0612340099', address: '6 place des Pyrénées', postal: '66120', city: 'Font-Romeu'],
            [firstName: 'Nicolas', lastName: 'Fournier', email: 'nicolas.fournier@demo.hookcook.fr',
             phone: '0612340110', address: '28 avenue du Canigou', postal: '66300', city: 'Thuir'],
    ]

    static void seedIfNeeded() {
        // Guard : seulement si HC_SEED_DEMO est activé
        if (System.getenv('HC_SEED_DEMO') != 'true') return

        // Guard d'idempotence : si le premier user démo existe, on sort
        if (User.findByEmail('marie.dupont@demo.hookcook.fr')) {
            return
        }

        println '─── [DemoSeedData] Injection des données de démo ───'

        User.withTransaction {
            List<User> users = createUsers()
            createOrders(users)
            // Flush pour que les reviews voient les order_items dans
            // leurs queries HQL (même transaction).
            User.withSession { it.flush() }
            createPermits(users)
            createContestRegistrations(users)
            createReviews(users)
            createCatchEntries(users)
            createWishlists(users)
            createStockAlerts(users)
        }

        println '─── [DemoSeedData] Seed démo terminé ───'
    }

    private static List<User> createUsers() {
        String passwordHash = ENCODER.encode('demo1234')
        DEMO_USERS.collect { m ->
            User u = new User(
                    email: m.email,
                    passwordHash: passwordHash,
                    firstName: m.firstName,
                    lastName: m.lastName,
                    phone: m.phone,
                    addressLine: m.address,
                    postalCode: m.postal,
                    city: m.city,
                    country: 'France',
                    role: 'ROLE_USER',
            )
            u.save(failOnError: true, flush: true)
            u
        }
    }

    // ─────── Commandes ────────────────────────────────────────────
    // 18 commandes étalées sur les 6 derniers mois, montants variés,
    // statuts mixés pour donner de vrais graphiques admin.
    private static void createOrders(List<User> users) {
        LocalDate today = LocalDate.now()

        // Chaque entrée : [idxUser, monthsAgo, [[productId, qty], ...], status]
        List orders = [
                // Mois en cours
                [0, 0, [['hc-bas-ligne', 2], ['hc-hamecons-truite', 1]], 'paid'],
                [1, 0, [['hc-sauvage-9-5', 1]], 'paid'],
                [2, 0, [['hc-leurre-chevesne', 3]], 'shipped'],
                // -1 mois
                [3, 1, [['hc-moulinet-carp', 1], ['hc-wf6-soie', 1]], 'delivered'],
                [4, 1, [['hc-veste-pluie', 1]], 'delivered'],
                [5, 1, [['hc-boite-mouches', 2]], 'delivered'],
                // -2 mois
                [6, 2, [['hc-brochet-strike', 1], ['hc-leurre-brochet', 2]], 'delivered'],
                [7, 2, [['hc-cuissardes', 1]], 'delivered'],
                [0, 2, [['hc-sauvage-9-5', 1], ['hc-bas-ligne', 3]], 'delivered'],
                // -3 mois
                [8, 3, [['hc-hamecons-truite', 2]], 'delivered'],
                [9, 3, [['hc-wf6-soie', 1], ['hc-boite-mouches', 1]], 'delivered'],
                [1, 3, [['hc-leurre-chevesne', 2]], 'delivered'],
                // -4 mois
                [2, 4, [['hc-veste-pluie', 1], ['hc-cuissardes', 1]], 'delivered'],
                [3, 4, [['hc-moulinet-carp', 1]], 'delivered'],
                // -5 mois
                [4, 5, [['hc-brochet-strike', 1]], 'delivered'],
                [5, 5, [['hc-sauvage-9-5', 1], ['hc-wf6-soie', 1], ['hc-bas-ligne', 1]], 'delivered'],
                [6, 5, [['hc-hamecons-truite', 5]], 'delivered'],
                // Annulée (montre les status moins fréquents)
                [7, 1, [['hc-moulinet-carp', 1]], 'cancelled'],
        ]

        int i = 0
        orders.each { entry ->
            User u = users[entry[0] as int]
            int monthsAgo = entry[1] as int
            List items = entry[2] as List
            String status = entry[3] as String
            LocalDate date = today.minusMonths(monthsAgo).minusDays((i * 3) % 28)
            Instant ts = date.atStartOfDay(ZoneId.systemDefault()).toInstant()

            CustomerOrder o = new CustomerOrder(
                    reference: "HC-2186-${UUID.randomUUID().toString().replace('-', '').take(8).toUpperCase()}",
                    user: u,
                    email: u.email,
                    addressLine: u.addressLine,
                    postalCode: u.postalCode,
                    city: u.city,
                    shippingMode: 'Standard Colissimo',
                    status: status,
                    statusLabel: OrderService.STATUS_LABELS[status],
            )

            BigDecimal subtotal = BigDecimal.ZERO
            items.each { it ->
                String productId = it[0] as String
                int qty = it[1] as int
                Product p = Product.get(productId)
                if (!p) return
                BigDecimal lineTotal = p.price * qty
                subtotal += lineTotal
                OrderItem oi = new OrderItem(
                        productId: p.id, productName: p.name,
                        productSku: p.sku, productBrand: p.brand,
                        productImageUrl: p.imageUrl,
                        unitPrice: p.price, qty: qty,
                )
                o.addToItems(oi)
            }
            BigDecimal shipping = subtotal >= 120 ? BigDecimal.ZERO : new BigDecimal('5.90')
            o.subtotal = subtotal
            o.shipping = shipping
            o.total = subtotal + shipping
            o.save(failOnError: true)
            // On force dateCreated ensuite (Hibernate le met à now() autrement)
            CustomerOrder.executeUpdate(
                    'update CustomerOrder o set o.dateCreated = :d, o.lastUpdated = :d where o.id = :id',
                    [d: Date.from(ts), id: o.id],
            )
            i++
        }
    }

    // ─────── Permis ───────────────────────────────────────────────
    private static void createPermits(List<User> users) {
        List perms = [
                [0, 'annuel', 'approved', 3],    // Marie, approuvé il y a 3 mois
                [1, 'annuel', 'approved', 2],    // Paul, approuvé
                [2, 'semaine', 'approved', 1],   // Sophie, approuvé il y a 1 mois
                [3, 'annuel', 'pending', 0],     // Julien, en instruction
                [4, 'decouverte', 'approved', 4],// Camille, approuvé
                [5, 'annuel', 'rejected', 2],    // Antoine, rejeté
        ]

        perms.each { entry ->
            User u = users[entry[0] as int]
            String typeId = entry[1] as String
            String status = entry[2] as String
            int monthsAgo = entry[3] as int
            PermitType type = PermitType.get(typeId)
            if (!type) return

            Instant ts = LocalDate.now().minusMonths(monthsAgo).atStartOfDay(ZoneId.systemDefault()).toInstant()

            String statusLabel = [
                    pending : 'En instruction',
                    approved: 'Approuvé',
                    rejected: 'Rejeté',
            ][status]

            List<Map> history = [
                    [label: 'Demande envoyée', date: '—', done: true],
                    [label: 'Paiement confirmé', date: '—', done: true],
                    [label: 'En instruction (fédération)', date: '—',
                     done: true, current: status == 'pending'],
            ]
            if (status == 'approved') {
                history << [label: 'Approuvé par la fédération', date: '—', done: true, current: true]
            } else if (status == 'rejected') {
                history << [label: 'Rejet notifié', date: '—', done: true, current: true]
            } else {
                history << [label: 'Décision', date: null, done: false]
            }

            Permit p = new Permit(
                    reference: "FR-2026-${UUID.randomUUID().toString().replace('-', '').take(10).toUpperCase()}",
                    user: u,
                    typeId: typeId, typeTitle: type.title,
                    amount: type.price,
                    department: '66 — Pyrénées-Orientales',
                    firstName: u.firstName, lastName: u.lastName,
                    birthDate: '1985-06-15',
                    status: status, statusLabel: statusLabel,
                    historyJson: JsonOutput.toJson(history),
            )
            p.save(failOnError: true)
            Permit.executeUpdate(
                    'update Permit p set p.dateCreated = :d, p.lastUpdated = :d where p.id = :id',
                    [d: Date.from(ts), id: p.id],
            )
        }
    }

    // ─────── Inscriptions concours ────────────────────────────────
    private static void createContestRegistrations(List<User> users) {
        List regs = [
                [0, 'vesoul-2026-05', 'hommes-am'],
                [1, 'vesoul-2026-05', 'hommes-exp'],
                [2, 'vesoul-2026-05', 'femmes'],
                [3, 'saone-2026-06', 'hommes-am'],
                [4, 'saone-2026-06', 'hommes-exp'],
                [5, 'etang-carpe-nuit', 'hommes-am'],
                [6, 'etang-carpe-nuit', 'femmes'],
                [7, 'doubs-2026-03', 'hommes-am'],
                [8, 'vesoul-2026-05', 'hommes-am'],
                [9, 'saone-2026-06', 'hommes-am'],
        ]

        regs.each { entry ->
            User u = users[entry[0] as int]
            String contestId = entry[1] as String
            String cat = entry[2] as String
            Contest c = Contest.get(contestId)
            if (!c) return
            if (ContestRegistration.findByUserAndContest(u, c)) return

            ContestRegistration r = new ContestRegistration(
                    user: u, contest: c, category: cat,
                    permitNumber: "FR-2026-${UUID.randomUUID().toString().replace('-', '').take(10).toUpperCase()}",
            )
            r.save(failOnError: true)
            c.inscrits = (c.inscrits ?: 0) + 1
            c.save(failOnError: true)
        }
    }

    // ─────── Avis produits (achat vérifié) ────────────────────────
    // On crée les avis APRES les commandes pour que `verifiedPurchase`
    // soit réellement true (basé sur l'historique order_items).
    private static void createReviews(List<User> users) {
        // Formant : [idxUser, productId, rating, title, comment]
        List reviews = [
                [0, 'hc-bas-ligne', 5, 'Parfait en sèche',
                 'Fluoro très fin, invisible sous l\'eau. Utilisé sur la Têt en mai, aucune casse sur des truites de 30 cm. Bon rapport qualité/prix.'],
                [1, 'hc-sauvage-9-5', 5, 'La canne rêvée pour la Têt',
                 'Assemblée à Prades, on le sent au toucher. Lancer doux, bonne action, parfaite en petite rivière. Je la recommande à tous les pêcheurs mouche.'],
                [3, 'hc-moulinet-carp', 4, 'Costaud et fiable',
                 'Grande bobine, frein progressif. Tient bien les 48h au bord du lac de Vinça. Seul bémol : un peu lourd pour de longues sessions.'],
                [4, 'hc-veste-pluie', 5, 'Imperméable à toute épreuve',
                 'Membrane 3 couches, jamais mouillé même sous gros temps. Capuche ajustable bien pensée. Taille M correspond bien.'],
                [5, 'hc-boite-mouches', 4, 'Solide et pratique',
                 'Fermeture magnétique précise, 24 emplacements bien dimensionnés. Légère et facile à glisser dans le gilet.'],
                [6, 'hc-brochet-strike', 5, 'Redoutable sur swimbait',
                 'Blank rigide comme annoncé, lancers de swimbaits 90g sans souci. Talon renforcé bien confortable en combat. Bonne finition.'],
                [7, 'hc-cuissardes', 4, 'Belle épuisette artisanale',
                 'Noyer tourné très soigné, filet sans nœuds respectueux du poisson. Pliable sur gilet. Un poil fragile au manche mais beau produit.'],
                [0, 'hc-hamecons-truite', 5, 'Hameçons parfaits',
                 'Acier fin, ardillon écrasable, bonne pénétration. Utilisés au montage de sèches, aucune casse. Achat que je re-ferai.'],
        ]

        reviews.each { entry ->
            User u = users[entry[0] as int]
            String productId = entry[1] as String
            int rating = entry[2] as int
            String title = entry[3] as String
            String comment = entry[4] as String

            // Vérifie qu'on a bien un order_item correspondant
            boolean bought = OrderItem.executeQuery(
                    'select count(oi) from OrderItem oi where oi.productId = :pid and oi.order.user = :u',
                    [pid: productId, u: u],
            )[0] > 0
            if (!bought) return
            if (ProductReview.findByUserAndProductId(u, productId)) return

            ProductReview r = new ProductReview(
                    productId: productId, user: u,
                    rating: rating, title: title, comment: comment,
                    verifiedPurchase: true,
            )
            r.save(failOnError: true)
        }

        // Met à jour les agrégats sur les produits concernés
        Set<String> touched = reviews.collect { it[1] as String } as Set
        touched.each { pid ->
            Product p = Product.get(pid)
            if (!p) return
            List<ProductReview> all = ProductReview.findAllByProductId(pid)
            if (all.isEmpty()) return
            BigDecimal avg = all.sum { it.rating } / (all.size() as BigDecimal)
            p.rating = avg.setScale(1, BigDecimal.ROUND_HALF_UP)
            p.reviews = all.size()
            p.save(failOnError: true)
        }
    }

    // ─────── Carnet de prise ──────────────────────────────────────
    private static void createCatchEntries(List<User> users) {
        LocalDate today = LocalDate.now()
        List entries = [
                [0, 'truite', 34, 420, 'La Têt — Olette', 'Sedge olive #14', 'Couvert 12°', today.minusDays(5)],
                [1, 'truite', 28, 310, 'Le Tech — Prats', 'Nymphe casquée', 'Ensoleillé 18°', today.minusDays(12)],
                [3, 'carpe', 62, 4200, 'Lac de Vinça', 'Bouillette fraise', 'Pluvieux 14°', today.minusDays(18)],
                [4, 'brochet', 78, 3800, 'Agly aval', 'Swimbait gardon', 'Venté 9°', today.minusDays(3)],
                [5, 'ombre', 41, 580, 'La Têt — Olette', 'Peute noire #16', 'Brumeux matin', today.minusDays(22)],
                [6, 'sandre', 52, 1800, 'Lac de Vinça', 'Leurre souple shad', 'Frais 11°', today.minusDays(8)],
        ]

        entries.each { entry ->
            User u = users[entry[0] as int]
            String species = entry[1] as String
            int taille = entry[2] as int
            Integer poids = entry[3] as Integer
            String spot = entry[4] as String
            String bait = entry[5] as String
            String weather = entry[6] as String
            LocalDate d = entry[7] as LocalDate

            new CatchEntry(
                    user: u, species: species,
                    taille: taille, poids: poids,
                    spot: spot, bait: bait, weather: weather,
                    catchDate: d.toString(),
                    photoLabel: "IMG_${UUID.randomUUID().toString().take(4).toUpperCase()}",
            ).save(failOnError: true)
        }
    }

    // ─────── Wishlist ─────────────────────────────────────────────
    private static void createWishlists(List<User> users) {
        List items = [
                [0, 'hc-wf6-soie'],
                [0, 'hc-brochet-strike'],
                [1, 'hc-moulinet-carp'],
                [2, 'hc-cuissardes'],
                [3, 'hc-leurre-brochet'],
                [4, 'hc-veste-pluie'],
                [5, 'hc-boite-mouches'],
        ]
        items.each { it ->
            User u = users[it[0] as int]
            String pid = it[1] as String
            if (!Product.get(pid)) return
            if (WishlistItem.findByUserAndProductId(u, pid)) return
            new WishlistItem(user: u, productId: pid).save(failOnError: true)
        }
    }

    // ─────── Alertes stock ────────────────────────────────────────
    // Bonus : 2 users ont demandé à être prévenus sur des produits
    // actuellement en stock (alertes déclarées mais inactives).
    private static void createStockAlerts(List<User> users) {
        // Crée seulement si le produit est effectivement à 0 (règle
        // métier). Aujourd'hui aucun n'est à 0 donc on skippe proprement.
        List alerts = [
                [0, 'hc-sauvage-9-5'],
                [1, 'hc-brochet-strike'],
        ]
        alerts.each { a ->
            User u = users[a[0] as int]
            String pid = a[1] as String
            Product p = Product.get(pid)
            if (!p || (p.stock ?: 0) > 0) return
            if (StockAlert.findByUserAndProductIdAndNotified(u, pid, false)) return
            new StockAlert(user: u, productId: pid).save(failOnError: true)
        }
    }
}
