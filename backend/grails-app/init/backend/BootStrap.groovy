package backend

class BootStrap {

    def init = { servletContext ->
        seedAdmin()
        seedCategories()
        seedTechniques()
        seedSpecies()
        seedContests()
        seedProducts()
    }

    private void seedAdmin() {
        String email = 'admin@hookcook.fr'
        User.withTransaction {
            if (User.findByEmail(email)) return
            def encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(12)
            new User(
                    email: email,
                    passwordHash: encoder.encode('admin1234'),
                    firstName: 'Admin',
                    lastName: 'Hook & Cook',
                    role: 'ROLE_ADMIN',
            ).save(failOnError: true, flush: true)
            log.info('Seeded admin user: {} / admin1234', email)
        }
    }

    def destroy = {
    }

    private void seedCategories() {
        Category.withTransaction {
            if (Category.count() > 0) return
            [
                    [id: 'cannes', name: 'Cannes', count: 47],
                    [id: 'moulinets', name: 'Moulinets', count: 38],
                    [id: 'leurres', name: 'Leurres & appâts', count: 124],
                    [id: 'soies-lignes', name: 'Soies & lignes', count: 29],
                    [id: 'vetements', name: 'Vêtements', count: 56],
                    [id: 'accessoires', name: 'Accessoires', count: 81],
            ].each { data ->
                Category c = new Category(name: data.name, displayCount: data.count)
                c.id = data.id
                c.save(failOnError: true, flush: true)
            }
            log.info('Seeded {} categories.', Category.count())
        }
    }

    private void seedTechniques() {
        Technique.withTransaction {
            if (Technique.count() > 0) return
            [
                    [id: 'mouche', name: 'Mouche'],
                    [id: 'carnassiers', name: 'Carnassiers'],
                    [id: 'peche-fond', name: 'Pêche au fond'],
                    [id: 'anglaise', name: 'Anglaise'],
                    [id: 'surfcasting', name: 'Surfcasting'],
                    [id: 'streetfishing', name: 'Street-fishing'],
            ].each { data ->
                Technique t = new Technique(name: data.name)
                t.id = data.id
                t.save(failOnError: true, flush: true)
            }
            log.info('Seeded {} techniques.', Technique.count())
        }
    }

    private void seedSpecies() {
        Species.withTransaction {
            if (Species.count() > 0) return
            [
                [id: 'truite', name: 'Truite', latin: 'Salmo trutta', water: 'rivière', months: [3, 4, 5, 6, 7, 8, 9], imageUrl: 'https://loremflickr.com/900/600/brown-trout,fish/all?lock=101'],
                [id: 'brochet', name: 'Brochet', latin: 'Esox lucius', water: 'lac/rivière', months: [5, 6, 7, 8, 9, 10, 11, 12, 1], imageUrl: 'https://loremflickr.com/900/600/northern-pike,fish/all?lock=102'],
                [id: 'sandre', name: 'Sandre', latin: 'Sander lucioperca', water: 'lac/rivière', months: [5, 6, 7, 8, 9, 10, 11, 12, 1], imageUrl: 'https://loremflickr.com/900/600/zander,fish/all?lock=103'],
                [id: 'carpe', name: 'Carpe', latin: 'Cyprinus carpio', water: 'étang/lac', months: [4, 5, 6, 7, 8, 9, 10, 11], imageUrl: 'https://loremflickr.com/900/600/common-carp,fish/all?lock=104'],
                [id: 'bar', name: 'Bar', latin: 'Dicentrarchus labrax', water: 'mer', months: [3, 4, 5, 6, 7, 8, 9, 10, 11], imageUrl: 'https://loremflickr.com/900/600/sea-bass,fish/all?lock=105'],
                [id: 'perche', name: 'Perche', latin: 'Perca fluviatilis', water: 'lac/rivière', months: [3, 4, 5, 6, 7, 8, 9, 10, 11], imageUrl: 'https://loremflickr.com/900/600/european-perch,fish/all?lock=106'],
                [id: 'silure', name: 'Silure', latin: 'Silurus glanis', water: 'rivière', months: [5, 6, 7, 8, 9, 10], imageUrl: 'https://loremflickr.com/900/600/catfish,river/all?lock=107'],
                [id: 'ombre', name: 'Ombre', latin: 'Thymallus thymallus', water: 'rivière', months: [5, 6, 7, 8, 9, 10, 11, 12], imageUrl: 'https://loremflickr.com/900/600/grayling,fish/all?lock=108'],
            ].each { Map data ->
                Species s = new Species(name: data.name, latin: data.latin, water: data.water, imageUrl: data.imageUrl)
                s.id = data.id
                s.months = data.months
                s.save(failOnError: true, flush: true)
            }
            log.info('Seeded {} species.', Species.count())
        }
    }

    private void seedContests() {
        Contest.withTransaction {
            if (Contest.count() > 0) return
            [
                [
                        id         : 'vesoul-2026-05',
                        title      : 'Open de Vesoul — Truite fario',
                        date       : '2026-05-04',
                        dateDisplay: '04 MAI',
                        lieu       : 'Lac de Vesoul (70)',
                        distance   : '18 km',
                        format     : 'No-kill · Équipes de 2',
                        price      : 25.0,
                        species    : ['truite'],
                        inscrits   : 42,
                        max        : 60,
                        reglement  : 'Le concours se tient sur le lac de Vesoul de 7h à 18h. Équipes de deux pêcheurs, sélection par tirage au sort des postes. Matériel libre — mouche, toc, lancer léger — mais hameçons sans ardillon obligatoires. Tous poissons mesurés et relâchés.',
                ],
                [
                        id         : 'saone-2026-06',
                        title      : 'Concours carpe 24h — Saône',
                        date       : '2026-06-14',
                        dateDisplay: '14 JUIN',
                        lieu       : 'Saône — Chalon (71)',
                        distance   : '62 km',
                        format     : '24h · Individuel',
                        price      : 45.0,
                        species    : ['carpe'],
                        inscrits   : 58,
                        max        : 60,
                        reglement  : 'Départ samedi 8h, pesée dimanche 8h. Pontons tirés au sort la veille. Amorçage libre, deux cannes max. Classement au poids total des 3 plus grosses prises.',
                ],
                [
                        id         : 'doubs-2026-03',
                        title      : 'Ouverture Truite — Le Doubs',
                        date       : '2026-03-14',
                        dateDisplay: '14 MAR',
                        lieu       : 'Le Doubs, Montbéliard (25)',
                        distance   : '8 km',
                        format     : 'Classique · Individuel',
                        price      : 0.0,
                        species    : ['truite'],
                        inscrits   : 89,
                        max        : 120,
                        reglement  : "Journée d'ouverture de la truite en première catégorie. Pêche de 6h30 au coucher du soleil. Pesée et remise de prix à 18h à la Maison de la pêche.",
                ],
                [
                        id         : 'etang-carpe-nuit',
                        title      : 'Nocturne Étang de la Forge',
                        date       : '2026-07-19',
                        dateDisplay: '19 JUIL',
                        lieu       : 'Étang de la Forge (25)',
                        distance   : '35 km',
                        format     : 'Nocturne · Individuel',
                        price      : 30.0,
                        species    : ['carpe', 'silure'],
                        inscrits   : 18,
                        max        : 40,
                        reglement  : 'Nocturne de 20h à 6h. Une canne par pêcheur. Classement combiné poids / nombre.',
                ],
            ].each { Map data ->
                Contest c = new Contest(
                        title      : data.title,
                        date       : data.date,
                        dateDisplay: data.dateDisplay,
                        lieu       : data.lieu,
                        distance   : data.distance,
                        format     : data.format,
                        price      : data.price as BigDecimal,
                        inscrits   : data.inscrits,
                        max        : data.max,
                        reglement  : data.reglement,
                )
                c.id = data.id
                c.species = data.species
                c.save(failOnError: true, flush: true)
            }
            log.info('Seeded {} contests.', Contest.count())
        }
    }

    private void seedProducts() {
        Product.withTransaction {
            if (Product.count() > 0) return

            List<Map> seed = [
                [
                        id         : 'hc-sauvage-9-5',
                        sku        : 'HC-2186-WF5F',
                        name       : 'Canne mouche Sauvage 9 ft #5',
                        category   : 'cannes',
                        technique  : 'mouche',
                        price      : 189.0,
                        wasPrice   : null,
                        stock      : 14,
                        rating     : 4.6,
                        reviews    : 38,
                        species    : ['truite', 'ombre'],
                        water      : 'rivière',
                        months     : [3, 4, 5, 6, 7, 8, 9],
                        brand      : 'Hook & Cook',
                        img        : 'Canne mouche Sauvage 9ft — vue complète',
                        imageUrl   : 'https://loremflickr.com/800/1000/fly-fishing-rod,fishing/all?lock=201',
                        description: 'Soie WF5F adaptée aux petites rivières et ruisseaux de montagne. Blank en carbone à fort module, dessiné pour charger le bas de canne en lancers courts — idéale pour pêcher sous branches.',
                        story      : "Fabriquée à Saint-Jean-Pied-de-Port par l'atelier Peyre, cette canne reprend le profil des cannes que Jean-Marc monte depuis trente-deux ans pour les guides du Pays basque. Chaque blank est scellé à la main, les anneaux alignés au fil, le porte-moulinet tourné dans un morceau de noyer local.\n\nElle est taillée pour la truite farios en eau vive — ce que Jean-Marc appelle \"le geste court et la remontée lente\". Vous n'achetez pas une canne de série.",
                        variants   : [longueur: ['8 ft', '9 ft', '10 ft'], action: ['Moyenne', 'Moyenne-rapide', 'Rapide']],
                        specs      : [
                                Longueur: '9 ft (2.74 m)',
                                Soie: 'WF5F',
                                Action: 'Moyenne-rapide',
                                Poids: '108 g',
                                Brins: '4',
                                Étui: 'Tube aluminium brossé',
                                Garantie: "5 ans pièces et main-d'œuvre",
                        ],
                ],
                [
                        id         : 'hc-wf6-soie',
                        sku        : 'HC-0284-LS6',
                        name       : 'Soie flottante WF6F Liaison',
                        category   : 'soies-lignes',
                        technique  : 'mouche',
                        price      : 64.9,
                        stock      : 42,
                        rating     : 4.8,
                        reviews    : 91,
                        species    : ['truite', 'brochet'],
                        water      : 'rivière/lac',
                        months     : [3, 4, 5, 6, 7, 8, 9, 10],
                        brand      : 'Cordier Roubinet',
                        img        : 'Soie WF6F — bobine + détail tresse',
                        imageUrl   : 'https://loremflickr.com/800/1000/fly-fishing-line,spool/all?lock=202',
                        description: "Profil à avant lourd pour charger rapidement le bas de canne. Cœur tressé 16 brins, gaine lissée à la cire d'abeille. Lancers doux sur 25 mètres.",
                        story      : "Cordier Roubinet est l'un des derniers cordiers français à tresser ses soies manuellement. Le cœur est monté sur un métier vieux d'un siècle, la gaine lissée avec une cire préparée par le fils du fondateur.",
                        variants   : [grammage: ['WF4', 'WF5', 'WF6', 'WF7'], couleur: ['Ivoire', 'Vert mousse']],
                        specs      : [
                                Grammage         : 'WF6F',
                                'Longueur totale': '27.4 m',
                                Densité          : 'Flottante',
                                Cœur             : 'Tressé 16 brins',
                                Pointe           : '0.9 mm',
                        ],
                ],
                [
                        id         : 'hc-brochet-strike',
                        sku        : 'HC-4401-BR90',
                        name       : 'Canne carnassiers Strike 2.40 m',
                        category   : 'cannes',
                        technique  : 'carnassiers',
                        price      : 259.0,
                        wasPrice   : 299.0,
                        stock      : 6,
                        rating     : 4.7,
                        reviews    : 24,
                        species    : ['brochet', 'sandre', 'silure'],
                        water      : 'lac/rivière',
                        months     : [5, 6, 7, 8, 9, 10, 11, 12, 1],
                        brand      : 'Hook & Cook',
                        img        : 'Canne carnassiers Strike — vue complète',
                        imageUrl   : 'https://loremflickr.com/800/1000/baitcasting-rod,fishing-rod/all?lock=203',
                        description: 'Blank rigide pour lancer des swimbaits lourds en toute précision. Talon renforcé pour le combat avec les gros poissons.',
                        variants   : [longueur: ['2.10 m', '2.40 m', '2.70 m'], puissance: ['20-60 g', '40-100 g', '80-160 g']],
                        specs      : [Longueur: '2.40 m', Puissance: '40-100 g', Action: 'Rapide', Poids: '184 g', Brins: '2'],
                ],
                [
                        id         : 'hc-leurre-chevesne',
                        sku        : 'HC-3018-CH5',
                        name       : 'Leurre souple Chevesne 5 cm (pack de 6)',
                        category   : 'leurres',
                        technique  : 'carnassiers',
                        price      : 12.5,
                        stock      : 180,
                        rating     : 4.5,
                        reviews    : 142,
                        species    : ['perche', 'sandre'],
                        water      : 'lac/rivière',
                        months     : [3, 4, 5, 6, 7, 8, 9, 10, 11],
                        brand      : 'Hook & Cook',
                        img        : 'Leurres souples — pack ouvert',
                        imageUrl   : 'https://loremflickr.com/800/1000/soft-plastic-lure,fishing-lure/all?lock=204',
                        description: 'Imitation de vairon. Queue vibrante, odeur attractant. Idéal en finesse sur perches actives.',
                        variants   : [couleur: ['Naturel', 'Perch', 'Motor Oil', 'Chartreuse']],
                ],
                [
                        id         : 'hc-moulinet-carp',
                        sku        : 'HC-5511-CA80',
                        name       : 'Moulinet Carpe Long-cast 8000',
                        category   : 'moulinets',
                        technique  : 'peche-fond',
                        price      : 179.0,
                        stock      : 9,
                        rating     : 4.6,
                        reviews    : 56,
                        species    : ['carpe', 'silure'],
                        water      : 'étang/lac',
                        months     : [4, 5, 6, 7, 8, 9, 10, 11],
                        brand      : 'Hook & Cook',
                        img        : 'Moulinet Carp 8000 — profil',
                        imageUrl   : 'https://loremflickr.com/800/1000/fishing-reel,carp/all?lock=205',
                        description: 'Grande bobine long-cast, 5 roulements étanches. Frein arrière 12 kg, idéal pour la carpe de nuit.',
                        variants   : [taille: ['6000', '8000', '10000']],
                        specs      : [Capacité: '420 m / 0.35 mm', Ratio: '4.6:1', Roulements: '5 + 1', Poids: '618 g', Frein: '12 kg'],
                ],
                [
                        id         : 'hc-veste-pluie',
                        sku        : 'HC-9032-VP',
                        name       : 'Veste de pluie Estuaire 3 couches',
                        category   : 'vetements',
                        technique  : null,
                        price      : 289.0,
                        stock      : 22,
                        rating     : 4.9,
                        reviews    : 74,
                        species    : [],
                        water      : 'mer/rivière',
                        months     : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                        brand      : 'Hook & Cook',
                        img        : 'Veste Estuaire — silhouette 3/4',
                        imageUrl   : 'https://loremflickr.com/800/1000/rain-jacket,outdoor/all?lock=206',
                        description: 'Membrane 3 couches 20k/20k. Capuche ajustable, poches waders, ourlet bas pour pêcher en cuissardes.',
                        variants   : [taille: ['S', 'M', 'L', 'XL', 'XXL'], couleur: ['Algue', 'Grès', 'Ardoise']],
                ],
                [
                        id         : 'hc-boite-mouches',
                        sku        : 'HC-1108-BM24',
                        name       : 'Boîte à mouches 24 emplacements',
                        category   : 'accessoires',
                        technique  : 'mouche',
                        price      : 32.0,
                        stock      : 64,
                        rating     : 4.4,
                        reviews    : 38,
                        species    : ['truite', 'ombre'],
                        water      : 'rivière',
                        months     : [3, 4, 5, 6, 7, 8, 9],
                        brand      : 'Hook & Cook',
                        img        : 'Boîte à mouches 24 — ouverte',
                        imageUrl   : 'https://loremflickr.com/800/1000/fly-box,fly-fishing/all?lock=207',
                        description: 'Boîte alu compartimentée, fermeture magnétique. 24 emplacements mousse anti-rouille.',
                        variants   : [couleur: ['Laiton', 'Noir mat']],
                ],
                [
                        id         : 'hc-hamecons-truite',
                        sku        : 'HC-2204-HT14',
                        name       : 'Hameçons truite nº14 (boîte de 50)',
                        category   : 'accessoires',
                        technique  : 'mouche',
                        price      : 8.9,
                        stock      : 240,
                        rating     : 4.7,
                        reviews    : 89,
                        species    : ['truite'],
                        water      : 'rivière',
                        months     : [3, 4, 5, 6, 7, 8, 9],
                        brand      : 'Tournon',
                        img        : 'Hameçons truite — boîte ouverte',
                        imageUrl   : 'https://loremflickr.com/800/1000/fishing-hooks,fly-tying/all?lock=208',
                        description: 'Hameçons anglais nº14, fil fin, ardillon écrasable. Finition noir mat.',
                        variants   : [taille: ['12', '14', '16', '18']],
                ],
                [
                        id         : 'hc-epuisette-pliante',
                        sku        : 'HC-6607-EP',
                        name       : 'Épuisette pliante en noyer 60 cm',
                        category   : 'accessoires',
                        technique  : null,
                        price      : 78.0,
                        stock      : 12,
                        rating     : 4.9,
                        reviews    : 23,
                        species    : ['truite', 'ombre', 'perche'],
                        water      : 'rivière',
                        months     : [3, 4, 5, 6, 7, 8, 9, 10],
                        brand      : 'Atelier Peyre',
                        img        : 'Épuisette noyer — repliée',
                        imageUrl   : 'https://loremflickr.com/800/1000/fishing-net,wood/all?lock=209',
                        description: 'Manche en noyer tourné main, filet caoutchouc sans nœuds. Pliable sur gilet.',
                        variants   : [longueur: ['50 cm', '60 cm', '80 cm']],
                ],
                [
                        id         : 'hc-bas-ligne',
                        sku        : 'HC-0812-BL',
                        name       : 'Bas de ligne fluorocarbone 0.16 mm',
                        category   : 'soies-lignes',
                        technique  : 'mouche',
                        price      : 11.5,
                        stock      : 140,
                        rating     : 4.5,
                        reviews    : 68,
                        species    : ['truite', 'ombre'],
                        water      : 'rivière',
                        months     : [3, 4, 5, 6, 7, 8, 9],
                        brand      : 'Tournon',
                        img        : 'Bas de ligne fluorocarbone — bobine',
                        imageUrl   : 'https://loremflickr.com/800/1000/fishing-line,tippet/all?lock=210',
                        description: "Fluorocarbone japonais haute résistance. Invisible sous l'eau.",
                        variants   : [diametre: ['0.12', '0.14', '0.16', '0.18', '0.20']],
                ],
                [
                        id         : 'hc-cuissardes',
                        sku        : 'HC-7711-CU',
                        name       : 'Cuissardes respirantes Source',
                        category   : 'vetements',
                        technique  : null,
                        price      : 349.0,
                        stock      : 7,
                        rating     : 4.8,
                        reviews    : 41,
                        species    : [],
                        water      : 'rivière',
                        months     : [3, 4, 5, 6, 7, 8, 9, 10, 11],
                        brand      : 'Hook & Cook',
                        img        : 'Cuissardes Source — silhouette',
                        imageUrl   : 'https://loremflickr.com/800/1000/waders,fly-fishing/all?lock=211',
                        description: 'Membrane 4 couches au genou, chaussons néoprène 4 mm, ceinture renforcée.',
                        variants   : [taille: ['S', 'M', 'L', 'XL']],
                ],
                [
                        id         : 'hc-leurre-brochet',
                        sku        : 'HC-3322-SB18',
                        name       : 'Swimbait brochet Wake 18 cm',
                        category   : 'leurres',
                        technique  : 'carnassiers',
                        price      : 38.0,
                        stock      : 36,
                        rating     : 4.7,
                        reviews    : 52,
                        species    : ['brochet', 'silure'],
                        water      : 'lac/rivière',
                        months     : [5, 6, 7, 8, 9, 10, 11, 12, 1],
                        brand      : 'Hook & Cook',
                        img        : 'Swimbait brochet 18cm',
                        imageUrl   : 'https://loremflickr.com/800/1000/swimbait,fishing-lure/all?lock=212',
                        description: 'Swimbait 3 sections, nage en S. Hameçons triples VMC. Pour prospection lente.',
                        variants   : [couleur: ['Gardon', 'Perch', 'Firetiger', 'Black']],
                ],
        ]

            seed.each { Map data ->
                Product p = new Product()
                data.each { key, value ->
                    if (value != null) p[key] = value
                }
                p.save(failOnError: true, flush: true)
            }
            log.info('Seeded {} products.', Product.count())
        }
    }
}
