# Next steps

Ordered so each step can be tested before the next. Items marked **verify** need a real test, not just code review.

## 1. Connect Supabase (verify)
1. Create a Supabase project. Keep the service role key out of git.
2. Copy `.env.example` to `.env.local` and fill in the three values.
3. Apply `0001_init.sql`, then `seed.sql`.
4. Add a temporary `console.log(await listBusinesses())` check or a small test page to confirm the anon client reads the seeded rows.

## 2. Swap the service layer to Supabase (verify)
Replace function bodies in `src/lib/services/business-service.ts` with queries through `getSupabaseBrowserClient()` or the server client. Keep function names and return types. Then run the RLS checks in `DATABASE.md`.

## 3. Authentication (verify)
- Build the login and register forms (Supabase `signInWithPassword`, `signUp`, or OTP).
- Add `/auth/callback` to handle the redirect.
- Replace `getCurrentUser()` in `src/lib/auth/session.ts` with a session lookup on the server, reading the profile row for the role.
- Add `middleware.ts` (or per-layout checks) to protect `/vendors/dashboard` and `/admin`. Check roles on the server, not only in the UI.

## 4. Vendor onboarding
- Multi-step form that writes a `BusinessDraft` (type already defined).
- Image upload to Supabase Storage with size and type limits.
- Slug generation with uniqueness check.

## 5. Reviews
- Signed-in customers only. Enforced by the unique constraint and RLS.
- Moderation through the admin dashboard.

## 6. Verification workflow
- Vendor submits a `verification_requests` row with a document.
- Admin approves or rejects. The admin action must update both the request and `businesses.verification_status`, using the server, not the browser.

## 7. Search and discovery
- Move from in-memory filtering to Postgres full-text search or `ilike`.
- Add pagination (`PaginatedResponse` type is ready).
- Connect the map page to coordinates with a map library (choose a free option first).

## 8. Subscriptions and payments (decision needed)
Choose a payment provider before writing code. Use provider webhooks to update `subscriptions`. Do not show plan upgrades or charge users until this is built and tested.

## 9. AI features (decision needed)
Choose a provider and a budget. Run AI jobs on the server, log each one in `ai_tasks`, and show the AI assistant only to signed-in vendors.

## 10. Quality and release
- Add tests: unit tests for services and utils, and end-to-end tests for explore, business profile and auth.
- Add CI running type check, lint and build on every push.
- Fix the existing tooling issues listed below.

## Known issues in the existing project
- `"lint": "next lint"` is removed in Next 16. Replace with `eslint .`.
- `eslint-config-next@0.2.4` does not match Next 16. Install the 16.x version.
- README still says Next.js 14.
- Node 22 or newer is required by `@supabase/supabase-js` 2.118.
