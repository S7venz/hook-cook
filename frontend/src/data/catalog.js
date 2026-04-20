export const species = [
  { id: 'truite', name: 'Truite', latin: 'Salmo trutta', water: 'rivière', months: [3, 4, 5, 6, 7, 8, 9], imageUrl: 'https://loremflickr.com/900/600/brown-trout,fish/all?lock=101' },
  { id: 'brochet', name: 'Brochet', latin: 'Esox lucius', water: 'lac/rivière', months: [5, 6, 7, 8, 9, 10, 11, 12, 1], imageUrl: 'https://loremflickr.com/900/600/northern-pike,fish/all?lock=102' },
  { id: 'sandre', name: 'Sandre', latin: 'Sander lucioperca', water: 'lac/rivière', months: [5, 6, 7, 8, 9, 10, 11, 12, 1], imageUrl: 'https://loremflickr.com/900/600/zander,fish/all?lock=103' },
  { id: 'carpe', name: 'Carpe', latin: 'Cyprinus carpio', water: 'étang/lac', months: [4, 5, 6, 7, 8, 9, 10, 11], imageUrl: 'https://loremflickr.com/900/600/common-carp,fish/all?lock=104' },
  { id: 'bar', name: 'Bar', latin: 'Dicentrarchus labrax', water: 'mer', months: [3, 4, 5, 6, 7, 8, 9, 10, 11], imageUrl: 'https://loremflickr.com/900/600/sea-bass,fish/all?lock=105' },
  { id: 'perche', name: 'Perche', latin: 'Perca fluviatilis', water: 'lac/rivière', months: [3, 4, 5, 6, 7, 8, 9, 10, 11], imageUrl: 'https://loremflickr.com/900/600/european-perch,fish/all?lock=106' },
  { id: 'silure', name: 'Silure', latin: 'Silurus glanis', water: 'rivière', months: [5, 6, 7, 8, 9, 10], imageUrl: 'https://loremflickr.com/900/600/catfish,river/all?lock=107' },
  { id: 'ombre', name: 'Ombre', latin: 'Thymallus thymallus', water: 'rivière', months: [5, 6, 7, 8, 9, 10, 11, 12], imageUrl: 'https://loremflickr.com/900/600/grayling,fish/all?lock=108' },
];

export const categories = [
  { id: 'cannes', name: 'Cannes', count: 47 },
  { id: 'moulinets', name: 'Moulinets', count: 38 },
  { id: 'leurres', name: 'Leurres & appâts', count: 124 },
  { id: 'soies-lignes', name: 'Soies & lignes', count: 29 },
  { id: 'vetements', name: 'Vêtements', count: 56 },
  { id: 'accessoires', name: 'Accessoires', count: 81 },
];

export const techniques = [
  { id: 'mouche', name: 'Mouche' },
  { id: 'carnassiers', name: 'Carnassiers' },
  { id: 'peche-fond', name: 'Pêche au fond' },
  { id: 'anglaise', name: 'Anglaise' },
  { id: 'surfcasting', name: 'Surfcasting' },
  { id: 'streetfishing', name: 'Street-fishing' },
];

export const contests = [
  {
    id: 'vesoul-2026-05',
    title: 'Open de Vesoul — Truite fario',
    date: '2026-05-04',
    dateDisplay: '04 MAI',
    lieu: 'Lac de Vesoul (70)',
    distance: '18 km',
    format: 'No-kill · Équipes de 2',
    prix: 25,
    species: ['truite'],
    inscrits: 42,
    max: 60,
    reglement:
      'Le concours se tient sur le lac de Vesoul de 7h à 18h. Équipes de deux pêcheurs, sélection par tirage au sort des postes. Matériel libre — mouche, toc, lancer léger — mais hameçons sans ardillon obligatoires. Tous poissons mesurés et relâchés.',
  },
  {
    id: 'saone-2026-06',
    title: 'Concours carpe 24h — Saône',
    date: '2026-06-14',
    dateDisplay: '14 JUIN',
    lieu: 'Saône — Chalon (71)',
    distance: '62 km',
    format: '24h · Individuel',
    prix: 45,
    species: ['carpe'],
    inscrits: 58,
    max: 60,
    reglement:
      'Départ samedi 8h, pesée dimanche 8h. Pontons tirés au sort la veille. Amorçage libre, deux cannes max. Classement au poids total des 3 plus grosses prises.',
  },
  {
    id: 'doubs-2026-03',
    title: 'Ouverture Truite — Le Doubs',
    date: '2026-03-14',
    dateDisplay: '14 MAR',
    lieu: 'Le Doubs, Montbéliard (25)',
    distance: '8 km',
    format: 'Classique · Individuel',
    prix: 0,
    species: ['truite'],
    inscrits: 89,
    max: 120,
    reglement:
      "Journée d'ouverture de la truite en première catégorie. Pêche de 6h30 au coucher du soleil. Pesée et remise de prix à 18h à la Maison de la pêche.",
  },
  {
    id: 'etang-carpe-nuit',
    title: 'Nocturne Étang de la Forge',
    date: '2026-07-19',
    dateDisplay: '19 JUIL',
    lieu: 'Étang de la Forge (25)',
    distance: '35 km',
    format: 'Nocturne · Individuel',
    prix: 30,
    species: ['carpe', 'silure'],
    inscrits: 18,
    max: 40,
    reglement:
      'Nocturne de 20h à 6h. Une canne par pêcheur. Classement combiné poids / nombre.',
  },
];

export function findContest(id) {
  return contests.find((c) => c.id === id) ?? null;
}

export const carnet = [
  {
    id: 'c1',
    date: '2026-04-12',
    species: 'truite',
    taille: 34,
    spot: 'Loue — tronçon inférieur',
    bait: 'Mouche sèche CDC #16',
    photo: 'Truite fario 34cm',
  },
  {
    id: 'c2',
    date: '2026-04-08',
    species: 'ombre',
    taille: 31,
    spot: 'Doubs — Mouthier',
    bait: 'Nymphe pheasant tail #16',
    photo: 'Ombre 31cm',
  },
  {
    id: 'c3',
    date: '2026-03-22',
    species: 'truite',
    taille: 28,
    spot: 'Dessoubre',
    bait: 'Sèche CDC olive #18',
    photo: 'Truite 28cm',
  },
];
