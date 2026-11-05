# LocalRoots AI: Architecture

## Stack
- **Next.js 16** (App Router, React 19, TypeScript strict)
- **Tailwind CSS 3** and **Lucide React** icons
- **Supabase** (Postgres, Auth, Storage). Planned, not yet connected end to end.

## Route structure

Route groups (folders in parentheses) organise the app without changing URLs.

| Area | Route | Folder | Access |
|---|---|---|---|
| Home | `/` | `src/app/page.tsx` | Public |
| Customer discovery | `/explore`, `/map`, `/about` | `src/app/(customer)/` | Public |
| Business profiles | `/business/[slug]` | `src/app/(customer)/business/[slug]/` | Public (active listings only) |
| Vendor dashboard | `/vendors`, `/vendors/dashboard` | `src/app/(vendor)/` | Vendor (not enforced yet) |
| Admin dashboard | `/admin` | `src/app/(admin)/admin/` | Admin (not enforced yet) |
| Authentication | `/auth/login`, `/auth/register` | `src/app/auth/` | Public |

Each customer route with data has `loading.tsx` (skeleton), `error.tsx` (retry) and, where a missing record is possible, `not-found.tsx`. Empty results use the shared `EmptyState` component.

## Layers

```
Pages / layouts (src/app)            Server Components by default
   │
Components (src/components)          Presentational; 'use client' only when needed
   │
Services (src/lib/services)          The ONLY place pages get data from
   │
Data source                          Sample data today; Supabase later
   ├── src/lib/data/sample-data.ts   Fictional test data
   └── src/lib/supabase/*            Browser and server clients
```

Pages never read sample arrays or call Supabase directly. They call functions in `business-service.ts`. Swapping sample data for Supabase means changing function bodies in that one file.

## Types (`src/types`)

One file per domain: `user`, `business`, `product`, `category`, `review`, `verification`, `subscription`, `ai-task`, plus `api`. Import everything from `@/types`.

- Field names mirror the database columns (snake_case), so no mapping layer is needed.
- `BusinessDraft` lists the fields a vendor may submit. It excludes `verification_status` and rating fields on purpose: those are server- or admin-controlled.
- Enum-like values are `as const` arrays, so the same list drives the TypeScript type, validation and the SQL enum.

## Environment and secrets

| Variable | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server | Project URL. Not secret. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser and server | Public key. Access is controlled by Row Level Security. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Bypasses RLS. Never prefix with `NEXT_PUBLIC_`. |

- Real values go in `.env.local` (git-ignored). `.env.example` holds empty placeholders and is committed.
- `src/lib/config/env.ts` returns `null` instead of throwing when settings are missing, so the app still builds and runs without a backend.
- `src/lib/supabase/server.ts` must only be imported from server code.

## Supabase clients

- `client.ts`: `getSupabaseBrowserClient()` for Client Components. Returns `null` if unconfigured.
- `server.ts`: `createServerClient()` with the service role key. Use only in Route Handlers and Server Actions for trusted operations, such as admin writes.

Most reads should use the anon client with RLS, so the service role key is used rarely.

## Authentication status

`src/lib/auth/session.ts` returns `null` for every request. Protected pages therefore show a "sign-in required" state. Nothing is faked. Login and register pages are still placeholders. See `NEXT_STEPS.md` for the wiring plan.

## Loading, empty and error states

| State | Component | Where used |
|---|---|---|
| Loading | `Skeleton`, `ListingCardSkeleton`, `loading.tsx` | Explore, business profile |
| Empty | `EmptyState` | No search results, no products, no reviews, no dashboard data |
| Error | `ErrorState`, `error.tsx` | Explore, business profile (with "Try again") |
| Not found | `not-found.tsx`, `notFound()` | Unknown or inactive business slug |
| Locked | `AccessNotice` | Vendor and admin dashboards |

## Business data model

Listing fields: name, description, category, tags, state, district, city, address, pincode, latitude/longitude, images, website and social links (Instagram, Facebook, YouTube), contact phone and email, verification status, active flag, average rating and rating count. See `DATABASE.md` for the table definition.

## Conventions
- Components are small and named by what they show.
- Use `import type` for type-only imports.
- Sample data is clearly marked as fictional. Verified status is never set by sample data.
- Do not add payment code until a payment provider decision is made.
