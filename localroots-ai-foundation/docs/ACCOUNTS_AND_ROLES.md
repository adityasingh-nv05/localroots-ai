# Accounts, roles and vendor registration

## The rules

1. **No one can make themselves an admin.** Sign-up, profile edits, and API calls cannot produce an admin account. The database refuses them.
2. **Admin is granted only by a trusted server process.** That means the service-role key, run from your own machine (`scripts/admin-role.mjs`), or the SQL editor in the Supabase dashboard. Admins cannot grant admin to others through the app.
3. **Vendors are customers who have upgraded.** A vendor account can only be reached from a customer account. An admin account can never be changed by this path.
4. **Vendors do not verify anything.** New businesses are created **inactive** and **unverified**. An admin must publish and verify each one.
5. **Business access comes from membership.** A row in `business_members` gives a person a role on one business: `owner`, `manager` or `staff`.

## Roles

| Account role | Who has it | How it is set |
|---|---|---|
| `customer` | Everyone who signs up | Default for every new account. Sign-up metadata is ignored for roles. |
| `vendor` | People who registered as vendors | `become_vendor()`, called by the signed-in customer. |
| `admin` | Your team only | `grant_admin()`, from the service role or SQL editor. Audited. |

| Business role | Can edit listing | Can manage products | Can request verification | Can see team |
|---|---|---|---|---|
| `owner` | Yes | Yes | Yes | Yes |
| `manager` | Yes | Yes | No | No |
| `staff` | No | Yes | No | No |

Admins can publish, hide, and verify any listing. Only the database functions or admins can change `verification_status`, `is_active`, rating totals, or account roles.

## Flows

### Customer sign-up
1. The visitor signs up with email, password and display name. The app sends only `full_name` (see `buildSignUpOptions`).
2. The database creates a `profiles` row with role `customer`.

### Vendor sign-up
1. Sign-up as above. The app never sends a role.
2. After the visitor signs in, the app calls `becomeVendor()`, which runs `become_vendor()`. The profile role becomes `vendor`. Calling it again is harmless.
3. The app calls `createVendorBusiness()`, which runs `create_vendor_business()`. The database:
   - requires the vendor role,
   - checks name, web address, description, and location,
   - allows up to 10 businesses per vendor,
   - creates the business **inactive and unverified**,
   - adds the vendor as `owner` in `business_members`.
4. The business stays hidden from the public until an admin publishes and verifies it.

### Admin assignment
Run from your trusted machine, with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`:

```bash
node scripts/admin-role.mjs grant <user-uuid>
node scripts/admin-role.mjs revoke <user-uuid>
```

Or in the SQL editor:

```sql
select public.grant_admin('<user-uuid>');
select public.revoke_admin('<user-uuid>');
```

Every change writes a row to `admin_audit_log`. Keep `SUPABASE_SERVICE_ROLE_KEY` out of any shared machine, CI log, or browser code.

## What the database enforces

| Attempt | Result |
|---|---|
| Sign up with `role: admin` in metadata | Ignored. Account is `customer`. |
| Update own profile `role` through the API | Refused (column privilege and trigger). |
| Call `grant_admin` with the anon or user key | Refused (no permission). |
| Vendor inserts a business row directly | Refused (no insert policy). Use `create_vendor_business`. |
| `create_vendor_business` with `verified` or ratings | Not possible: the function sets neither, and the trigger forces them. |
| Owner sets `is_active = true` on their own listing | Refused. Only admins publish. |
| Customer calls `create_vendor_business` | Refused: vendor role required. |
| Admin account calls `become_vendor` | Refused. |

## Verify it yourself

Replace `<URL>`, `<ANON>` (anon/publishable key), `<USER_TOKEN>` (access token of a signed-in test user) and `<UID>` (that user's id).

**1. Anonymous callers cannot grant admin.** Expect a permission error.
```bash
curl -s -X POST "<URL>/rest/v1/rpc/grant_admin" \
  -H "apikey: <ANON>" -H "Authorization: Bearer <ANON>" -H "Content-Type: application/json" \
  -d '{"p_user":"<UID>"}'
```

**2. A signed-in user cannot change their own role.** Expect an error, and the role stays `customer`.
```bash
curl -s -X PATCH "<URL>/rest/v1/profiles?id=eq.<UID>" \
  -H "apikey: <ANON>" -H "Authorization: Bearer <USER_TOKEN>" -H "Content-Type: application/json" \
  -H "Prefer: return=representation" -d '{"role":"admin"}'
```

**3. A customer can become a vendor.** Expect `"vendor"`.
```bash
curl -s -X POST "<URL>/rest/v1/rpc/become_vendor" \
  -H "apikey: <ANON>" -H "Authorization: Bearer <USER_TOKEN>" -H "Content-Type: application/json" -d '{}'
```

**4. A vendor cannot insert a business directly.** Expect a row-level security error.
```bash
curl -s -X POST "<URL>/rest/v1/businesses" \
  -H "apikey: <ANON>" -H "Authorization: Bearer <USER_TOKEN>" -H "Content-Type: application/json" \
  -d '{"slug":"direct-insert-test","name":"Test","category_slug":"food","state":"Karnataka","district":"Mysuru","city":"Mysuru","is_active":true,"verification_status":"verified"}'
```

**5. Vendor registration creates an inactive, unverified business.**
```bash
curl -s -X POST "<URL>/rest/v1/rpc/create_vendor_business" \
  -H "apikey: <ANON>" -H "Authorization: Bearer <USER_TOKEN>" -H "Content-Type: application/json" \
  -d '{"p_name":"Test Craft Studio","p_slug":"test-craft-studio","p_description":"Test","p_category":"handicrafts","p_state":"Karnataka","p_district":"Mysuru","p_city":"Mysuru","p_address":""}'
```
Then confirm:
- The public listing does not show it: `GET <URL>/rest/v1/businesses?slug=eq.test-craft-studio` with the anon key returns `[]`.
- The owner sees it with `verification_status = unverified` and `is_active = false`, using their user token.

**6. Admin grant works, and is audited.** Run the script from section "Admin assignment", then in the SQL editor:
```sql
select action, target_user_id, performed_by, created_at from public.admin_audit_log order by created_at desc;
```

**7. Clean up test data** in the Table Editor (delete the test business and profile you created). Do this in the dashboard, not with a bulk delete query.

## Not built yet
- Sign-up and sign-in screens. The functions are ready; the forms are not connected.
- Email confirmation handling. If confirmation is on, the vendor steps run after the visitor's first sign-in.
- Inviting managers and staff. The table supports it; the invite function is not written.
- Admin screens for publishing and verifying listings.
- Only one admin path is supported today (the trusted script or SQL editor).
