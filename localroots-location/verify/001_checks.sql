-- Run after 001. Every query should return the expected value.

-- 1. Exactly 36 states/UTs: 28 states and 8 union territories.
select kind, count(*) from public.states_uts group by kind order by kind;
-- expected: state 28, union_territory 8

-- 2. No duplicate state names within India.
select name, count(*) from public.states_uts group by name having count(*) > 1;
-- expected: no rows

-- 3. Reference tables are readable under RLS (run as anon role).
set local role anon;
select count(*) from public.states_uts;  -- expected: 36
reset role;

-- 4. Clients cannot write reference data (run as anon role).
set local role anon;
insert into public.states_uts (country_id, name, kind) values (1, 'Test', 'state');
-- expected: permission denied / new row violates row-level security policy
reset role;

-- 5. PIN code format check rejects invalid values.
insert into public.pincodes (code, district_id) values ('012345', 1);
-- expected: check constraint violation
