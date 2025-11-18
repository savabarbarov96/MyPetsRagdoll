import { CatData } from '@/services/convexCatService';

// High-quality ragdoll cat images from local assets
const RAGDOLL_IMAGE_URLS = [
  // Professional ragdoll cat photos - local optimized assets
  '/src/assets/featured-cat-1.jpg',
  '/src/assets/featured-cat-2.jpg',
  '/src/assets/model-cat-1.jpg',
  '/src/assets/model-cat-2.jpg',
  '/src/assets/model-cat-3.jpg',
  '/src/assets/66971fa7-cedb-4c2f-8201-1eafd603c1fc.jpg'
];

// Fallback to local assets if external images fail
const LOCAL_RAGDOLL_ASSETS = [
  '/src/assets/featured-cat-1.jpg',
  '/src/assets/featured-cat-2.jpg',
  '/src/assets/model-cat-1.jpg',
  '/src/assets/model-cat-2.jpg',
  '/src/assets/model-cat-3.jpg'
];

// Fallback Ragdoll cat data with professional images
export const FALLBACK_RAGDOLL_CATS: Omit<CatData, '_id' | '_creationTime'>[] = [
  {
    name: 'AURORA',
    subtitle: 'GENTLE SPIRIT',
    image: RAGDOLL_IMAGE_URLS[0],
    description: 'Красива женска рагдол с нежен характер, сини очи и мека козина.',
    age: '2 години',
    color: 'Seal point с бели маркировки',
    status: 'Примерна котка',
    gallery: [RAGDOLL_IMAGE_URLS[0], LOCAL_RAGDOLL_ASSETS[0]],
    gender: 'female',
    birthDate: '2022-03-15',
    registrationNumber: 'RD-2022-001',
    isDisplayed: true,
    category: 'adult',
    freeText: 'Изключително спокойна и приятелска'
  },
  {
    name: 'FELIX',
    subtitle: 'BLUE EYES CHARM',
    image: RAGDOLL_IMAGE_URLS[1],
    description: 'Величествен мъжки рагдол с характерни сини очи и спокоен темперамент.',
    age: '3 години',
    color: 'Blue point с бели лапи',
    status: 'Примерна котка',
    gallery: [RAGDOLL_IMAGE_URLS[1], LOCAL_RAGDOLL_ASSETS[1]],
    gender: 'male',
    birthDate: '2021-08-20',
    registrationNumber: 'RD-2021-002',
    isDisplayed: true,
    category: 'adult',
    freeText: 'Много добродушен и обича прегръдки'
  },
  {
    name: 'LUNA',
    subtitle: 'CLOUD PRINCESS',
    image: RAGDOLL_IMAGE_URLS[2],
    description: 'Сладко младо котенце рагдол с мека козина и любопитен характер.',
    age: '8 месеца',
    color: 'Chocolate point',
    status: 'Примерно котенце',
    gallery: [RAGDOLL_IMAGE_URLS[2], LOCAL_RAGDOLL_ASSETS[2]],
    gender: 'female',
    birthDate: '2024-05-10',
    registrationNumber: 'RD-2024-003',
    isDisplayed: true,
    category: 'kitten',
    freeText: 'Игриво и любопитно котенце'
  },
  {
    name: 'OSCAR',
    subtitle: 'GENTLE GIANT',
    image: RAGDOLL_IMAGE_URLS[3],
    description: 'Едър мъжки рагдол с спокоен темперамент и любвеобилен характер.',
    age: '4 години',
    color: 'Lilac point с кремави оттенъци',
    status: 'Примерна котка',
    gallery: [RAGDOLL_IMAGE_URLS[3], LOCAL_RAGDOLL_ASSETS[3]],
    gender: 'male',
    birthDate: '2020-12-05',
    registrationNumber: 'RD-2020-004',
    isDisplayed: true,
    category: 'adult',
    freeText: 'Перфектният семеен любимец'
  },
  {
    name: 'BELLA',
    subtitle: 'SNOW ANGEL',
    image: RAGDOLL_IMAGE_URLS[4],
    description: 'Нежна женска рагдол с ангелски характер и славни размери.',
    age: '1 година',
    color: 'Red point с бели маркировки',
    status: 'Примерна котка',
    gallery: [RAGDOLL_IMAGE_URLS[4], LOCAL_RAGDOLL_ASSETS[4]],
    gender: 'female',
    birthDate: '2023-01-25',
    registrationNumber: 'RD-2023-005',
    isDisplayed: true,
    category: 'adult',
    freeText: 'Много ласкава и обича вниманието'
  },
  {
    name: 'MILO',
    subtitle: 'TINY TREASURE',
    image: RAGDOLL_IMAGE_URLS[5],
    description: 'Дребно котенце рагдол с големи сини очи и игрив дух.',
    age: '5 месеца',
    color: 'Cream point',
    status: 'Примерно котенце',
    gallery: [RAGDOLL_IMAGE_URLS[5], LOCAL_RAGDOLL_ASSETS[0]],
    gender: 'male',
    birthDate: '2024-08-15',
    registrationNumber: 'RD-2024-006',
    isDisplayed: true,
    category: 'kitten',
    freeText: 'Много активно и забавно котенце'
  }
];

// Function to get fallback cats by category
export const getFallbackRagdollCatsByCategory = (category: 'all' | 'adult' | 'kitten' | 'retired') => {
  if (category === 'all') {
    return FALLBACK_RAGDOLL_CATS;
  }
  
  return FALLBACK_RAGDOLL_CATS.filter(cat => cat.category === category);
};

// Add IDs to fallback cats (for use when displaying)
export const getFallbackRagdollCatsWithIds = (category: 'all' | 'adult' | 'kitten' | 'retired') => {
  const cats = getFallbackRagdollCatsByCategory(category);
  return cats.map((cat, index) => ({
    ...cat,
    _id: `fallback-ragdoll-${index + 1}`,
    _creationTime: Date.now() - (index * 86400000) // Spread creation times
  })) as CatData[];
};