-- OPTIONAL sample data for local testing. Fictional businesses only.
-- Run after 0001_init.sql. Safe to re-run: uses ON CONFLICT.
-- Business rows have no owner, so they can be inserted with the service role or SQL editor.

insert into public.categories (slug, name, description, sort_order) values
  ('food', 'Food', 'Sample food and beverage listings', 1),
  ('fashion', 'Fashion', 'Sample fashion listings', 2),
  ('handicrafts', 'Handicrafts', 'Sample handicraft listings', 3),
  ('accessories', 'Accessories', 'Sample accessory listings', 4),
  ('services', 'Services', 'Sample service listings', 5),
  ('tourism', 'Tourism', 'Sample tourism listings', 6),
  ('agriculture', 'Agriculture', 'Sample agriculture listings', 7),
  ('homestay', 'Homestays', 'Sample homestay listings', 8)
on conflict (slug) do nothing;

insert into public.businesses (
  slug, name, description, category_slug, tags, state, district, city, address,
  latitude, longitude, verification_status, rating_average, rating_count
) values
  ('kaveri-filter-kaapi-house', 'Kaveri Filter Kaapi House',
   'Slow-brewed filter coffee and South Karnataka breakfast plates. Sample listing.',
   'food', array['filter coffee', 'breakfast'], 'Karnataka', 'Bengaluru Urban', 'Bengaluru',
   'Sample address, Bengaluru', 12.9716, 77.5946, 'pending', 4.6, 128),
  ('mysuru-silk-weave-studio', 'Mysuru Silk Weave Studio',
   'Handloom silk sarees and kurtas, with custom weaving orders. Sample listing.',
   'fashion', array['silk', 'handloom'], 'Karnataka', 'Mysuru', 'Mysuru',
   'Sample address, Mysuru', 12.2958, 76.6394, 'unverified', 4.7, 92),
  ('coorg-coffee-trail-guides', 'Coorg Coffee Trail Guides',
   'Half-day estate walks with tasting sessions and local stories. Sample listing.',
   'tourism', array['coffee estate', 'guided walk'], 'Karnataka', 'Kodagu', 'Madikeri',
   'Sample address, Madikeri', 12.4244, 75.7382, 'pending', 4.8, 77)
on conflict (slug) do nothing;
