-- Reference data only: the category list. Safe to run more than once.
-- Run after 0001_init.sql and 0002_security_and_schema_fixes.sql.
--
-- This file deliberately does NOT insert businesses, products or reviews.
-- Real listings should be added through the app or by you. For local development
-- without Supabase, the app shows built-in sample data (see docs/SUPABASE_SETUP.md).

insert into public.categories (slug, name, description, sort_order) values
  ('food', 'Food', 'Food and beverage', 1),
  ('fashion', 'Fashion', 'Clothing and textiles', 2),
  ('handicrafts', 'Handicrafts', 'Handmade crafts and art', 3),
  ('accessories', 'Accessories', 'Bags, jewellery and accessories', 4),
  ('services', 'Services', 'Tailoring, repairs and other services', 5),
  ('tourism', 'Tourism', 'Guided experiences and heritage tourism', 6),
  ('agriculture', 'Agriculture', 'Farm produce and agricultural goods', 7),
  ('homestay', 'Homestays', 'Stays hosted by local families', 8)
on conflict (slug) do nothing;

-- Country reference row. India is a fact. Its states, districts, cities, localities and PIN
-- codes must come from an authoritative source (see docs/GEOGRAPHY.md), not from this file.
insert into public.countries (iso_code, name, is_published) values
  ('IN', 'India', true)
on conflict (iso_code) do nothing;
