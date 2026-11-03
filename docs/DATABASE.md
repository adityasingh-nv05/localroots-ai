# Database

Schema lives in `supabase/migrations/0001_init.sql`. Optional test rows are in `supabase/seed.sql`.

## Apply the schema

**Option A: Supabase SQL editor (quickest).** Open your project, go to SQL Editor, paste `0001_init.sql` and run it. Then run `seed.sql` if you want sample rows.

**Option B: Supabase CLI.**
```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```
Run `seed.sql` through the SQL editor, since `db push` only applies migrations.

Run the migration once on a fresh project. It is not written to be re-run over an existing schema.

## Tables

| Table | Purpose | Key columns |
|---|---|---|
| `profiles` | One row per auth user | `id` (= auth.users.id), `role` |
| `categories` | Category list | `slug` (unique) |
| `businesses` | Listings | `slug` (unique), `category_slug`, `state`, `district`, `city`, `latitude`, `longitude`, `images`, social links, `verification_status`, `rating_average`, `rating_count` |
| `products` | Items a business sells | `business_id`, `price_inr` |
| `reviews` | Customer ratings | `business_id`, `user_id` (one review per user per business), `rating` 1 to 5 |
| `verification_requests` | Vendor requests for review | `business_id`, `status`, `reviewer_notes` |
| `subscriptions` | Plan records (no billing) | `business_id`, `plan`, `status` |
| `ai_tasks` | Log of AI jobs | `task_type`, `status`, `input`, `output` |

## Automation (triggers)
- **New user:** a `profiles` row is created automatically with role `customer`. Role is never taken from user metadata.
- **Rating:** inserting, editing or deleting a review recalculates `rating_average` and `rating_count` on the business.
- **updated_at:** set automatically when a business is edited.
- **Verification guard:** only admins (or the service role) can change `verification_status`.

## Row Level Security summary

| Table | Public (anon) | Owner / user | Admin |
|---|---|---|---|
| categories | read | read | write |
| businesses | read active | create own, update own | update any, delete |
| products | read (active business) | manage on own business | manage any |
| reviews | read | create/update/delete own | update/delete any |
| verification_requests | none | create own, read own | read/update all |
| subscriptions | none | read own | read all (no client writes) |
| ai_tasks | none | create own, read own | read all |
| profiles | none | read/update own display fields | read all |

`profiles.role` can only be changed by a service-role or SQL-editor operation. Users cannot promote themselves.

## Testing RLS
Before going live, test with two real accounts and the anon key:
1. As anonymous, confirm only active businesses are readable.
2. As vendor A, confirm you cannot update vendor B's business or set `verification_status`.
3. As a customer, confirm you cannot insert a review with another user's `user_id`.

## Changing the schema
Add a new file such as `0002_<change>.sql`. Never edit `0001_init.sql` after it has been applied to a real project.
