import type { KarnatakaLocation } from '@/types';

/**
 * Sample Karnataka exploration locations. Coordinates are approximate city centres.
 * A business belongs to a location when its city or district appears in these lists.
 */
export const KARNATAKA_LOCATIONS: readonly KarnatakaLocation[] = [
  {
    slug: 'bengaluru',
    name: 'Bengaluru',
    description: 'Cafés, design studios and weekend craft markets.',
    cities: ['Bengaluru'],
    districts: ['Bengaluru Urban'],
    latitude: 12.9716,
    longitude: 77.5946,
  },
  {
    slug: 'mysuru',
    name: 'Mysuru',
    description: 'Silk, sandalwood and rosewood crafts.',
    cities: ['Mysuru'],
    districts: ['Mysuru'],
    latitude: 12.2958,
    longitude: 76.6394,
  },
  {
    slug: 'mangaluru',
    name: 'Mangaluru',
    description: 'Coastal seafood and port-city flavours.',
    cities: ['Mangaluru'],
    districts: ['Dakshina Kannada'],
    latitude: 12.9141,
    longitude: 74.856,
  },
  {
    slug: 'udupi',
    name: 'Udupi',
    description: 'Temple traditions, coastal cuisine and tailoring.',
    cities: ['Udupi'],
    districts: ['Udupi'],
    latitude: 13.3409,
    longitude: 74.7421,
  },
  {
    slug: 'coorg',
    name: 'Coorg',
    description: 'Coffee estates, spice farms and hill homestays.',
    cities: ['Madikeri'],
    districts: ['Kodagu'],
    latitude: 12.4244,
    longitude: 75.7382,
  },
  {
    slug: 'hampi',
    name: 'Hampi',
    description: 'Vijayanagara ruins and stone and brass crafts.',
    cities: ['Hosapete'],
    districts: ['Vijayanagara'],
    latitude: 15.335,
    longitude: 76.46,
  },
  {
    slug: 'hubballi',
    name: 'Hubballi',
    description: 'Dharwad-region farms, markets and sweets.',
    cities: ['Hubballi'],
    districts: ['Dharwad'],
    latitude: 15.3647,
    longitude: 75.124,
  },
];

export function findKarnatakaLocation(slug: string | undefined): KarnatakaLocation | undefined {
  if (!slug) return undefined;
  return KARNATAKA_LOCATIONS.find((loc) => loc.slug === slug);
}
