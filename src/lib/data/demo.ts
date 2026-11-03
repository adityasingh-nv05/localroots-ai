/**
 * DEMO DATA ONLY.
 * Every business, artisan, product and price in this file is fictional sample
 * content for UI development. None of it describes a real or verified listing.
 */

export const DEMO_NOTE =
  'Sample content for demonstration. Listings are fictional and not verified.';

export type CategoryId =
  | 'food'
  | 'fashion'
  | 'handicrafts'
  | 'accessories'
  | 'services'
  | 'tourism';

export type Tone = 'green' | 'amber' | 'rose' | 'sky' | 'stone';

export interface CategoryInfo {
  id: CategoryId;
  label: string;
  blurb: string;
}

export const CATEGORIES: readonly CategoryInfo[] = [
  { id: 'food', label: 'Food', blurb: 'Filter coffee, millets and Udupi meals' },
  { id: 'fashion', label: 'Fashion', blurb: 'Handloom sarees and everyday wear' },
  { id: 'handicrafts', label: 'Handicrafts', blurb: 'Wooden toys, bronze and brassware' },
  { id: 'accessories', label: 'Accessories', blurb: 'Bags, jewellery and leather goods' },
  { id: 'services', label: 'Services', blurb: 'Tailoring, repairs and local guides' },
  { id: 'tourism', label: 'Tourism', blurb: 'Heritage walks and homestays' },
];

export function categoryName(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export interface DemoBusiness {
  id: string;
  name: string;
  category: CategoryId;
  city: string;
  district: string;
  rating: number;
  reviews: number;
  summary: string;
  tone: Tone;
}

export const FEATURED_BUSINESSES: readonly DemoBusiness[] = [
  {
    id: 'kaveri-filter-kaapi',
    name: 'Kaveri Filter Kaapi House',
    category: 'food',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    rating: 4.6,
    reviews: 128,
    summary: 'Slow-brewed filter coffee and South Karnataka breakfast plates.',
    tone: 'amber',
  },
  {
    id: 'maddur-millet-kitchen',
    name: 'Maddur Millet Kitchen',
    category: 'food',
    city: 'Mandya',
    district: 'Mandya',
    rating: 4.4,
    reviews: 64,
    summary: 'Ragi, jowar and millet meals cooked the traditional way.',
    tone: 'green',
  },
  {
    id: 'mysuru-silk-weave',
    name: 'Mysuru Silk Weave Studio',
    category: 'fashion',
    city: 'Mysuru',
    district: 'Mysuru',
    rating: 4.7,
    reviews: 92,
    summary: 'Handloom silk sarees and kurtas, with custom weaving orders.',
    tone: 'rose',
  },
  {
    id: 'hampi-stone-brass',
    name: 'Hampi Stone & Brass Works',
    category: 'handicrafts',
    city: 'Hosapete',
    district: 'Vijayanagara',
    rating: 4.5,
    reviews: 41,
    summary: 'Stone carvings and brassware inspired by Vijayanagara temple art.',
    tone: 'stone',
  },
  {
    id: 'coorg-coffee-trails',
    name: 'Coorg Coffee Trail Guides',
    category: 'tourism',
    city: 'Madikeri',
    district: 'Kodagu',
    rating: 4.8,
    reviews: 77,
    summary: 'Half-day estate walks with tasting sessions and local stories.',
    tone: 'green',
  },
  {
    id: 'udupi-coastal-tailors',
    name: 'Udupi Coastal Tailors',
    category: 'services',
    city: 'Udupi',
    district: 'Udupi',
    rating: 4.3,
    reviews: 29,
    summary: 'Custom tailoring, alterations and same-week stitching.',
    tone: 'sky',
  },
];

export interface DemoProduct {
  id: string;
  name: string;
  maker: string;
  city: string;
  category: CategoryId;
  price: number;
  tone: Tone;
}

export const TRENDING_PRODUCTS: readonly DemoProduct[] = [
  { id: 'channapatna-toy-set', name: 'Channapatna Wooden Toy Set', maker: 'Lakshmi Craft Co.', city: 'Channapatna', category: 'handicrafts', price: 1250, tone: 'amber' },
  { id: 'rosewood-inlay-box', name: 'Rosewood Inlay Jewellery Box', maker: 'Mysuru Wood Arts', city: 'Mysuru', category: 'handicrafts', price: 2400, tone: 'stone' },
  { id: 'ilkal-cotton-saree', name: 'Ilkal Handloom Cotton Saree', maker: 'Bagalkot Weavers Collective', city: 'Bagalkot', category: 'fashion', price: 3800, tone: 'rose' },
  { id: 'coorg-cardamom-pack', name: 'Coorg Cardamom Gift Pack', maker: 'Kodagu Spice Farm', city: 'Madikeri', category: 'food', price: 650, tone: 'green' },
  { id: 'bidri-pendant', name: 'Bidriware Silver Inlay Pendant', maker: 'Bidar Metal Studio', city: 'Bidar', category: 'accessories', price: 1900, tone: 'sky' },
  { id: 'jute-tote', name: 'Hand-stitched Jute Tote', maker: 'Bengaluru Craft Lab', city: 'Bengaluru', category: 'accessories', price: 950, tone: 'amber' },
];

export interface Destination {
  slug: string;
  name: string;
  region: string;
  tagline: string;
  highlights: readonly string[];
  emoji: string;
  tone: Tone;
}

export const DESTINATIONS: readonly Destination[] = [
  { slug: 'bengaluru', name: 'Bengaluru', region: 'Garden City', tagline: 'Cafés, design studios and weekend craft markets.', highlights: ['Filter coffee trails', 'Cubbon Park craft fairs', 'Malleshwaram heritage lanes'], emoji: '🌆', tone: 'amber' },
  { slug: 'mysuru', name: 'Mysuru', region: 'Palace City', tagline: 'Silk, sandalwood and a palace lit up at dusk.', highlights: ['Mysore Palace', 'Devaraja Market', 'Rosewood and silk crafts'], emoji: '🏰', tone: 'rose' },
  { slug: 'coorg', name: 'Coorg', region: 'Kodagu hills', tagline: 'Coffee estates, misty viewpoints and homestays.', highlights: ['Coffee estate walks', 'Abbey Falls', 'Homestay stays'], emoji: '☕', tone: 'green' },
  { slug: 'hampi', name: 'Hampi', region: 'Vijayanagara ruins', tagline: 'Boulder-strewn temples on the banks of the Tungabhadra.', highlights: ['Virupaksha Temple', 'Stone chariot', 'Sunset coracle rides'], emoji: '🛕', tone: 'stone' },
  { slug: 'udupi', name: 'Udupi', region: 'Coastal Karnataka', tagline: 'Temple traditions, coastal cuisine and calm beaches.', highlights: ['Sri Krishna Temple', 'Malpe Beach', 'Udupi-style cuisine'], emoji: '🌊', tone: 'sky' },
];

export interface SearchResult {
  kind: 'business' | 'product' | 'location';
  title: string;
  subtitle: string;
  href: string;
}

// Common alternate spellings, normalised so "Mysore" finds "Mysuru" and so on.
const ALIASES: Record<string, string> = {
  mysore: 'mysuru',
  bangalore: 'bengaluru',
  kodagu: 'coorg',
  madikeri: 'coorg',
  hosapete: 'hampi',
};
const ALIAS_RE = new RegExp(`\\b(${Object.keys(ALIASES).join('|')})\\b`, 'g');

function normalise(text: string): string {
  return text.toLowerCase().replace(ALIAS_RE, (m) => ALIASES[m] ?? m);
}

/** Token-based search over the demo data. Every word in the query must match. */
export function searchDemo(query: string, limit = 6): SearchResult[] {
  const tokens = normalise(query).trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const matches = (haystack: string) => tokens.every((t) => haystack.includes(t));
  const results: SearchResult[] = [];

  for (const b of FEATURED_BUSINESSES) {
    const hay = normalise(`${b.name} ${b.city} ${b.district} ${b.summary} ${categoryName(b.category)}`);
    if (matches(hay)) {
      results.push({
        kind: 'business',
        title: b.name,
        subtitle: `${categoryName(b.category)} · ${b.city}`,
        href: `/explore?q=${encodeURIComponent(b.name)}`,
      });
    }
  }

  for (const p of TRENDING_PRODUCTS) {
    const hay = normalise(`${p.name} ${p.maker} ${p.city} ${categoryName(p.category)}`);
    if (matches(hay)) {
      results.push({
        kind: 'product',
        title: p.name,
        subtitle: `by ${p.maker} · ${p.city}`,
        href: `/explore?q=${encodeURIComponent(p.name)}`,
      });
    }
  }

  for (const d of DESTINATIONS) {
    const hay = normalise(`${d.name} ${d.region} ${d.tagline} ${d.highlights.join(' ')}`);
    if (matches(hay)) {
      results.push({
        kind: 'location',
        title: d.name,
        subtitle: d.region,
        href: `/explore?q=${encodeURIComponent(d.name)}`,
      });
    }
  }

  return results.slice(0, limit);
}

/** Popular search terms shown in the hero. */
export const POPULAR_SEARCHES = ['Filter coffee', 'Mysuru silk', 'Channapatna', 'Coorg'] as const;
