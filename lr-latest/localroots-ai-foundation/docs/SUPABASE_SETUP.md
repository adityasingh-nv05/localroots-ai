# Supabase setup for LocalRoots AI

This guide connects the app to your Supabase project and shows how to confirm that
real database records are displayed.

## 1. Environment variables

Create `.env.local` in the project root (copy `.env.example`):

| Variable | Secret? | What it is | Used by |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | No | Your project URL, e.g. `https://abcdefgh.supabase.co`. | Server reads and browser client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No (public by design) | Anon key, or "publishable key" on newer projects. Access is controlled by row-level security. | Server reads (`createPublicServerClient`) and browser client |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Service-role key, or "secret key" on newer projects. Bypasses row-level security. | Nothing yet. Reserved for trusted admin jobs. Leave empty. |

Rules:
- Only the URL and anon key are needed to run the app.
- Never prefix a secret with `NEXT_PUBLIC_`. Anything with that prefix is sent to every visitor's browser.
- Restart `npm run dev` after changing `.env.local`, because `NEXT_PUBLIC_` values are fixed at build time.

Where to find the values: Supabase dashboard -> your project -> **Project Settings** -> **API** (or "API Keys").

The app chooses its data source like this:

| Situation | Data shown |
|---|---|
| URL and anon key set | Your Supabase database |
| Not set, `npm run dev` | Built-in fictional sample data, with a blue banner |
| Not set, production build | An error stating that Supabase is not configured. Sample data is never shown in production. |

## 2. Apply the database migrations

Open **SQL Editor** in the Supabase dashboard, then **New query**. Run each file below in order, pasting its full contents and clicking **Run**.

1. **`supabase/migrations/0001_init.sql`**, only if you have not run it before. It creates the tables, functions, triggers and policies.
2. **`supabase/migrations/0002_security_and_schema_fixes.sql`**. Adds `products.kind` and the security fixes. Safe to run after 0001 and safe to re-run.
3. **`supabase/migrations/0003_roles_and_membership.sql`**. Adds business membership, admin assignment only through trusted paths, and vendor registration functions. Safe to re-run.
4. **`supabase/migrations/0004_geography.sql`**. Adds the India-wide location hierarchy and links businesses to it. Creates no location records. See `docs/GEOGRAPHY.md`.
5. **`supabase/seed.sql`**. Inserts the eight category rows and the India country row. It inserts no businesses or other location records.

Each run should finish with "Success. No rows returned" or similar.

If you see **"type ... already exists"** or **"relation ... already exists"** when running 0001, it has already been applied. Skip it and continue with 0002. Do not drop tables to "start again" unless you intend to lose data. If another error appears, copy the full message and check it before continuing.

These migrations contain no `DROP TABLE`, `TRUNCATE`, or unfiltered `DELETE`. An automated test checks this.

## 3. Verify the schema (SQL Editor)

Run these read-only checks:

```sql
-- Every table should show rowsecurity = true
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- Policies that protect each table
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Categories from the seed (expect 8 rows)
select slug, name from public.categories order by sort_order;
```

The first query should list `businesses`, `products`, `reviews`, `categories`, `profiles`, `verification_requests`, `subscriptions` and `ai_tasks`, each with `rowsecurity` true.

## 4. Add real business records

The app shows only what is in your database. Add your own real listings through the **Table Editor** or the SQL Editor. Do not use fictional examples as production data.

Template (fill in the angle-bracket values with real information; the category slug must be one from the seed list):

```sql
insert into public.businesses (
  slug, name, description, category_slug,
  state, district, city, address,
  latitude, longitude, is_active
) values (
  '<unique-url-slug>',          -- lowercase, hyphens, e.g. 'my-craft-studio'
  '<business name>',
  '<what the business does>',
  '<category slug>',            -- food, fashion, handicrafts, accessories, services, tourism, agriculture, homestay
  'Karnataka',
  '<district>',
  '<city>',
  '<street address>',
  <latitude or null>,          -- both coordinates or neither
  <longitude or null>,
  true                          -- must be true to appear publicly
);
```

Notes:
- Listings are created as `unverified`. Verification must be granted by an admin, not by you through the app.
- Products and reviews are optional. Images can be added later through Supabase Storage.

## 5. Check the app

1. Start the app: `npm run dev`, then open http://localhost:3000/explore.
2. **Sample banner**: the blue "Showing built-in sample data" banner must not appear. Its absence means the database is being used.
3. **Your records**: each business you inserted with `is_active = true` appears as a card, with its real name, city, description and category. The count at the top matches the number of records.
4. **Detail page**: click a card, or open `http://localhost:3000/business/<your-slug>`. It shows the same name, address and coordinates as the table row.
5. **Empty state**: if the table has no active businesses, the page shows "No listings match your filters". That is the correct response for an empty database.
6. **Location chips**: a chip's count should match the number of your records in that city or district.

To confirm the rows come from Supabase and not from the code, change a value in the Table Editor (for example, the business description), refresh the page, and check that the change appears.

## 6. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Blue sample banner still shows | `.env.local` missing or misnamed, or dev server not restarted |
| "Supabase is not configured" in production | URL or anon key not set in the hosting environment |
| "Could not load businesses right now" | Check the terminal for `[supabase] reading "businesses" failed: ...`. Common causes: migrations not applied (`relation does not exist`), wrong URL or key |
| Explore empty, but rows exist in the Table Editor | Check `is_active` is `true` and `category_slug` matches a category. Confirm the anon key belongs to the same project |
| "Could not load review authors" | Migration 0002 not applied (the function is missing) |
| Admin or vendor changes fail | Expected: end users cannot change verification status, ratings, or re-publish listings |

## 7. Security model in brief

- The browser and the server both use the **anon key**. Row-level security applies to every query.
- Anyone can read **active** businesses, their products, and reviews. Inactive listings are hidden.
- Only the business owner can edit their listing. Only admins can change verification or hide a listing.
- Ratings are recalculated by a database trigger. Clients cannot set them.
- Reviewer names come from a restricted function that returns names only for people who have written a review.
- The service-role key is never sent to the browser and is not used by the app.

Known limitations (see `docs/NEXT_STEPS.md`): there is no sign-in yet, so no one can write data through the app; contact fields are public when the owner fills them in; and text search runs in memory.
