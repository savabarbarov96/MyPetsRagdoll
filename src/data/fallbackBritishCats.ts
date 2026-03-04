import { CatData } from '@/services/convexCatService';

// Fallback British Longhair cat data (empty - real cats come from the database)
export const FALLBACK_BRITISH_CATS: Omit<CatData, '_id' | '_creationTime'>[] = [];

// Function to get fallback British cats with mock IDs
export const getFallbackBritishCatsWithIds = (category: 'all' | 'adult' | 'kitten') => {
  const cats = category === 'all'
    ? FALLBACK_BRITISH_CATS
    : FALLBACK_BRITISH_CATS.filter(cat => cat.category === category);

  return cats.map((cat, index) => ({
    ...cat,
    _id: `fallback-british-${index + 1}`,
    _creationTime: Date.now() - (index * 86400000)
  })) as CatData[];
};
