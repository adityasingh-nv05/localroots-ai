/**
 * SAMPLE DATA FOR TESTING ONLY.
 * Business names, addresses, people, reviews and images are fictional. Nothing here is
 * a real or verified listing. Images are generated illustrations in /public/samples.
 * Verification is 'unverified' or 'pending' on purpose; no sample is verified.
 */
import type { Business, Category, CategorySlug, Product, Review, VerificationRequest } from '@/types';
import { CATEGORY_LABELS } from './categories';

const CATEGORY_ORDER: CategorySlug[] = [
  'food', 'fashion', 'handicrafts', 'accessories', 'services', 'tourism', 'agriculture', 'homestay',
];

export const SAMPLE_CATEGORIES: Category[] = CATEGORY_ORDER.map((slug, index) => ({
  id: `cat-${slug}`,
  slug,
  name: CATEGORY_LABELS[slug],
  description: `Sample ${CATEGORY_LABELS[slug].toLowerCase()} listings`,
  sort_order: index + 1,
}));

const BASE_TIME = '2026-01-10T00:00:00Z';

/** Two generated illustrations per business, matching files in public/samples. */
function sampleImages(slug: string): string[] {
  return [`/samples/${slug}-1.svg`, `/samples/${slug}-2.svg`];
}

type RequiredBusinessFields = Pick<
  Business,
  'id' | 'slug' | 'name' | 'description' | 'category' | 'city' | 'district' | 'state'
>;

/** Fills every database column with a safe default so sample rows match the schema. */
function makeBusiness(partial: RequiredBusinessFields & Partial<Business>): Business {
  return {
    owner_id: null,
    tags: [],
    address: `Sample address, ${partial.city}`,
    pincode: null,
    latitude: null,
    longitude: null,
    images: sampleImages(partial.slug),
    website_url: null,
    instagram_handle: null,
    facebook_url: null,
    youtube_url: null,
    contact_phone: null,
    contact_email: null,
    verification_status: 'unverified',
    is_active: true,
    rating_average: 0,
    rating_count: 0,
    created_at: BASE_TIME,
    updated_at: BASE_TIME,
    ...partial,
  };
}

export const SAMPLE_BUSINESSES: Business[] = [
  makeBusiness({
    id: 'biz-001',
    slug: 'kaveri-filter-kaapi-house',
    name: 'Kaveri Filter Kaapi House',
    description: 'Slow-brewed filter coffee and South Karnataka breakfast plates. Sample listing.',
    category: 'food',
    tags: ['filter coffee', 'breakfast', 'vegetarian'],
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    latitude: 12.9716,
    longitude: 77.5946,
    rating_average: 4.6,
    rating_count: 128,
    instagram_handle: 'kaveri_kaapi_demo',
    verification_status: 'pending',
  }),
  makeBusiness({
    id: 'biz-002',
    slug: 'maddur-millet-kitchen',
    name: 'Maddur Millet Kitchen',
    description: 'Ragi, jowar and millet meals cooked the traditional way. Sample listing.',
    category: 'food',
    tags: ['millets', 'traditional', 'healthy'],
    state: 'Karnataka',
    district: 'Mandya',
    city: 'Maddur',
    rating_average: 4.4,
    rating_count: 64,
  }),
  makeBusiness({
    id: 'biz-003',
    slug: 'mysuru-silk-weave-studio',
    name: 'Mysuru Silk Weave Studio',
    description: 'Handloom silk sarees and kurtas, with custom weaving orders. Sample listing.',
    category: 'fashion',
    tags: ['silk', 'handloom', 'custom orders'],
    state: 'Karnataka',
    district: 'Mysuru',
    city: 'Mysuru',
    latitude: 12.2958,
    longitude: 76.6394,
    rating_average: 4.7,
    rating_count: 92,
    website_url: 'https://example.com/demo-silk-studio',
  }),
  makeBusiness({
    id: 'biz-004',
    slug: 'hampi-stone-brass-works',
    name: 'Hampi Stone & Brass Works',
    description: 'Stone carvings and brassware inspired by Vijayanagara temple art. Sample listing.',
    category: 'handicrafts',
    tags: ['stone carving', 'brassware'],
    state: 'Karnataka',
    district: 'Vijayanagara',
    city: 'Hosapete',
    latitude: 15.269,
    longitude: 76.3909,
    rating_average: 4.5,
    rating_count: 41,
  }),
  makeBusiness({
    id: 'biz-005',
    slug: 'coorg-coffee-trail-guides',
    name: 'Coorg Coffee Trail Guides',
    description: 'Half-day estate walks with tasting sessions and local stories. Sample listing.',
    category: 'tourism',
    tags: ['coffee estate', 'guided walk'],
    state: 'Karnataka',
    district: 'Kodagu',
    city: 'Madikeri',
    latitude: 12.4244,
    longitude: 75.7382,
    rating_average: 4.8,
    rating_count: 77,
    facebook_url: 'https://example.com/demo-coffee-trails',
    verification_status: 'pending',
  }),
  makeBusiness({
    id: 'biz-006',
    slug: 'udupi-coastal-tailors',
    name: 'Udupi Coastal Tailors',
    description: 'Custom tailoring, alterations and same-week stitching. Sample listing.',
    category: 'services',
    tags: ['tailoring', 'alterations'],
    state: 'Karnataka',
    district: 'Udupi',
    city: 'Udupi',
    latitude: 13.3409,
    longitude: 74.7421,
    rating_average: 4.3,
    rating_count: 29,
  }),
  makeBusiness({
    id: 'biz-007',
    slug: 'wayanad-hill-homestay-demo',
    name: 'Wayanad Hill Homestay (Demo)',
    description: 'Two-room homestay surrounded by pepper and cardamom plantations. Sample listing.',
    category: 'homestay',
    tags: ['homestay', 'plantation'],
    state: 'Kerala',
    district: 'Wayanad',
    city: 'Kalpetta',
    latitude: 11.6085,
    longitude: 76.0826,
    rating_average: 4.2,
    rating_count: 15,
  }),
  makeBusiness({
    id: 'biz-008',
    slug: 'mangaluru-seafood-kitchen',
    name: 'Mangaluru Seafood Kitchen',
    description: 'Coastal seafood thalis and fish curry prepared with local spices. Sample listing.',
    category: 'food',
    tags: ['seafood', 'coastal', 'thali'],
    state: 'Karnataka',
    district: 'Dakshina Kannada',
    city: 'Mangaluru',
    latitude: 12.9141,
    longitude: 74.856,
    rating_average: 4.5,
    rating_count: 58,
  }),
  makeBusiness({
    id: 'biz-009',
    slug: 'hubballi-organic-farm-shop',
    name: 'Hubballi Organic Farm Shop',
    description: 'Stone-ground millet flour and seasonal vegetables from nearby farms. Sample listing.',
    category: 'agriculture',
    tags: ['organic', 'millet flour', 'farm produce'],
    state: 'Karnataka',
    district: 'Dharwad',
    city: 'Hubballi',
    latitude: 15.3647,
    longitude: 75.124,
    rating_average: 4.1,
    rating_count: 22,
  }),
  makeBusiness({
    id: 'biz-010',
    slug: 'bengaluru-craft-lab-accessories',
    name: 'Bengaluru Craft Lab Accessories',
    description: 'Hand-stitched bags and jewellery made by a small studio team. Sample listing.',
    category: 'accessories',
    tags: ['bags', 'jewellery', 'handmade'],
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    latitude: 12.9352,
    longitude: 77.6245,
    rating_average: 4.4,
    rating_count: 36,
  }),
];

export const SAMPLE_PRODUCTS: Product[] = [
  { id: 'prod-001', business_id: 'biz-001', name: 'Filter Coffee Powder, 250 g', description: 'Sample product: medium roast chicory blend.', kind: 'product', category: 'food', price_inr: 320, image_url: null, is_available: true, created_at: BASE_TIME },
  { id: 'prod-002', business_id: 'biz-001', name: 'Filter Coffee Breakfast Plate', description: 'Sample service-style meal: idli, vada and filter coffee.', kind: 'product', category: 'food', price_inr: 120, image_url: null, is_available: true, created_at: BASE_TIME },
  { id: 'prod-003', business_id: 'biz-002', name: 'Millet Meal Catering', description: 'Sample service: group millet lunches for events, booked in advance.', kind: 'service', category: 'food', price_inr: 250, image_url: null, is_available: true, created_at: BASE_TIME },
  { id: 'prod-004', business_id: 'biz-003', name: 'Handloom Silk Saree', description: 'Sample product: plain silk saree with contrast border.', kind: 'product', category: 'fashion', price_inr: 4200, image_url: null, is_available: true, created_at: BASE_TIME },
  { id: 'prod-005', business_id: 'biz-004', name: 'Brass Diya Set', description: 'Sample product: set of three hand-finished diyas.', kind: 'product', category: 'handicrafts', price_inr: 1100, image_url: null, is_available: false, created_at: BASE_TIME },
  { id: 'prod-006', business_id: 'biz-005', name: 'Half-day Estate Walk', description: 'Sample service: guided walk with a tasting session. Starting price.', kind: 'service', category: 'tourism', price_inr: 1200, image_url: null, is_available: true, created_at: BASE_TIME },
  { id: 'prod-007', business_id: 'biz-006', name: 'Custom Stitching', description: 'Sample service: made-to-measure stitching. Starting price.', kind: 'service', category: 'services', price_inr: 500, image_url: null, is_available: true, created_at: BASE_TIME },
  { id: 'prod-008', business_id: 'biz-008', name: 'Coastal Masala Spice Pack', description: 'Sample product: ground masala for fish curry.', kind: 'product', category: 'food', price_inr: 180, image_url: null, is_available: true, created_at: BASE_TIME },
  { id: 'prod-009', business_id: 'biz-009', name: 'Stone-ground Millet Flour, 1 kg', description: 'Sample product: ragi and jowar flour.', kind: 'product', category: 'agriculture', price_inr: 120, image_url: null, is_available: true, created_at: BASE_TIME },
  { id: 'prod-010', business_id: 'biz-010', name: 'Hand-stitched Jute Tote', description: 'Sample product: everyday tote with leather handles.', kind: 'product', category: 'accessories', price_inr: 950, image_url: null, is_available: true, created_at: BASE_TIME },
];

export const SAMPLE_REVIEWS: Review[] = [
  { id: 'rev-001', business_id: 'biz-001', user_id: 'user-demo-1', user_name: 'Demo Reviewer A', rating: 5, comment: 'Sample review: the filter coffee was excellent.', created_at: BASE_TIME },
  { id: 'rev-002', business_id: 'biz-001', user_id: 'user-demo-2', user_name: 'Demo Reviewer B', rating: 4, comment: 'Sample review: friendly staff and quick service.', created_at: BASE_TIME },
  { id: 'rev-003', business_id: 'biz-005', user_id: 'user-demo-3', user_name: 'Demo Reviewer C', rating: 5, comment: 'Sample review: the guide explained the plantation process clearly.', created_at: BASE_TIME },
  { id: 'rev-004', business_id: 'biz-008', user_id: 'user-demo-4', user_name: 'Demo Reviewer D', rating: 4, comment: 'Sample review: the thali was generous and well spiced.', created_at: BASE_TIME },
  { id: 'rev-005', business_id: 'biz-008', user_id: 'user-demo-5', user_name: 'Demo Reviewer E', rating: 5, comment: 'Sample review: the fish curry was the highlight.', created_at: BASE_TIME },
];

export const SAMPLE_VERIFICATION_REQUESTS: VerificationRequest[] = [
  { id: 'ver-001', business_id: 'biz-001', submitted_by: null, status: 'pending', document_path: null, reviewer_notes: null, reviewed_by: null, created_at: BASE_TIME, reviewed_at: null },
  { id: 'ver-002', business_id: 'biz-005', submitted_by: null, status: 'pending', document_path: null, reviewer_notes: null, reviewed_by: null, created_at: BASE_TIME, reviewed_at: null },
];
