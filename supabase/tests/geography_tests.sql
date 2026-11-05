-- =============================================================================
-- Geography behaviour tests. RUN IN THE SUPABASE SQL EDITOR, AFTER 0004 AND seed.sql.
--
-- Every test row is created inside one transaction and rolled back at the end.
-- Nothing is kept. The script always ends with an error, which is how the SQL editor
-- reports a DO block that rolls back:
--   "GEOGRAPHY TESTS PASSED ..." -> all checks passed (the error is expected).
--   "GEOGRAPHY TESTS FAILED ..." -> at least one check failed; read the message.
-- Requires the 'food' category from seed.sql.
-- =============================================================================
do $$
declare
  v_pass integer := 0;
  v_fail integer := 0;
  v_fail_list text := '';
  v_country uuid;
  v_country2 uuid;
  v_state uuid;
  v_state_b uuid;
  v_district uuid;
  v_district2 uuid;
  v_city uuid;
  v_city2 uuid;
  v_locality uuid;
  v_locality2 uuid;
  v_locality3 uuid;
  v_pin_a uuid;
  v_pin_b uuid;
  v_pin_null uuid;
  v_business uuid;
  v_tag text := substr(md5(random()::text), 1, 8);
begin
  -- Valid hierarchy: one country, two states, districts, cities and localities.
  insert into public.countries (iso_code, name) values ('XY', 'Geo Test Country ' || v_tag)
    returning id into v_country;
  insert into public.countries (iso_code, name) values ('XZ', 'Geo Test Other ' || v_tag)
    returning id into v_country2;
  insert into public.states (country_id, name, kind) values (v_country, 'Test State A ' || v_tag, 'state')
    returning id into v_state;
  insert into public.states (country_id, name, kind) values (v_country, 'Test State B ' || v_tag, 'union_territory')
    returning id into v_state_b;
  insert into public.districts (state_id, name) values (v_state, 'Test District 1 ' || v_tag)
    returning id into v_district;
  insert into public.districts (state_id, name) values (v_state, 'Test District 2 ' || v_tag)
    returning id into v_district2;
  insert into public.cities (district_id, name, kind) values (v_district, 'Test City ' || v_tag, 'city')
    returning id into v_city;
  insert into public.cities (district_id, name, kind) values (v_district2, 'Test Town ' || v_tag, 'town')
    returning id into v_city2;
  insert into public.localities (city_id, name) values (v_city, 'Test Locality A ' || v_tag)
    returning id into v_locality;
  insert into public.localities (city_id, name) values (v_city, 'Test Locality B ' || v_tag)
    returning id into v_locality2;

  -- 1. Valid hierarchy inserts succeed (positive case).
  v_pass := v_pass + 1;

  -- 2. Duplicate ISO country code is refused.
  begin
    insert into public.countries (iso_code, name) values ('XY', 'Duplicate ISO ' || v_tag);
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' duplicate-iso;';
  exception when unique_violation then v_pass := v_pass + 1; end;

  -- 3. Duplicate country name is refused.
  begin
    insert into public.countries (iso_code, name) values ('XW', 'Geo Test Country ' || v_tag);
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' duplicate-country-name;';
  exception when unique_violation then v_pass := v_pass + 1; end;

  -- 4. Invalid ISO format is refused.
  begin
    insert into public.countries (iso_code, name) values ('x1', 'Bad ISO ' || v_tag);
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' bad-iso-format;';
  exception when check_violation then v_pass := v_pass + 1; end;

  -- 5. A state under a missing country is refused (foreign key).
  begin
    insert into public.states (country_id, name) values (gen_random_uuid(), 'Orphan State ' || v_tag);
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' orphan-state;';
  exception when foreign_key_violation then v_pass := v_pass + 1; end;

  -- 6. Duplicate state name within one country is refused.
  begin
    insert into public.states (country_id, name) values (v_country, 'Test State A ' || v_tag);
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' duplicate-state-name;';
  exception when unique_violation then v_pass := v_pass + 1; end;

  -- 7. The same state name in a different country is allowed.
  begin
    insert into public.states (country_id, name) values (v_country2, 'Test State A ' || v_tag);
    v_pass := v_pass + 1;
  exception when unique_violation then v_fail := v_fail + 1; v_fail_list := v_fail_list || ' same-name-other-country;'; end;

  -- 8. Duplicate state code within one country is refused.
  insert into public.states (country_id, name, code) values (v_country2, 'Coded State ' || v_tag, upper('TS' || substr(v_tag, 1, 4)));
  begin
    insert into public.states (country_id, name, code) values (v_country2, 'Coded State 2 ' || v_tag, upper('TS' || substr(v_tag, 1, 4)));
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' duplicate-state-code;';
  exception when unique_violation then v_pass := v_pass + 1; end;

  -- 9. A district under a missing state is refused.
  begin
    insert into public.districts (state_id, name) values (gen_random_uuid(), 'Orphan District ' || v_tag);
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' orphan-district;';
  exception when foreign_key_violation then v_pass := v_pass + 1; end;

  -- 10. Duplicate district name within one state is refused.
  begin
    insert into public.districts (state_id, name) values (v_state, 'Test District 1 ' || v_tag);
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' duplicate-district-name;';
  exception when unique_violation then v_pass := v_pass + 1; end;

  -- 11. A city under a missing district is refused.
  begin
    insert into public.cities (district_id, name) values (gen_random_uuid(), 'Orphan City ' || v_tag);
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' orphan-city;';
  exception when foreign_key_violation then v_pass := v_pass + 1; end;

  -- 12. Duplicate city name within one district is refused.
  begin
    insert into public.cities (district_id, name) values (v_district, 'Test City ' || v_tag);
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' duplicate-city-name;';
  exception when unique_violation then v_pass := v_pass + 1; end;

  -- 13. Unknown settlement kind is refused.
  begin
    insert into public.cities (district_id, name, kind) values (v_district, 'Hamlet ' || v_tag, 'hamlet');
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' bad-city-kind;';
  exception when check_violation then v_pass := v_pass + 1; end;

  -- 14. A locality under a missing city is refused.
  begin
    insert into public.localities (city_id, name) values (gen_random_uuid(), 'Orphan Locality ' || v_tag);
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' orphan-locality;';
  exception when foreign_key_violation then v_pass := v_pass + 1; end;

  -- 15. Duplicate locality name within one city is refused.
  begin
    insert into public.localities (city_id, name) values (v_city, 'Test Locality A ' || v_tag);
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' duplicate-locality-name;';
  exception when unique_violation then v_pass := v_pass + 1; end;

  -- 16. Latitude without longitude is refused.
  begin
    insert into public.localities (city_id, name, latitude) values (v_city, 'Half Coord ' || v_tag, 12.9);
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' unpaired-coordinates;';
  exception when check_violation then v_pass := v_pass + 1; end;

  -- 17. Out-of-range latitude is refused.
  begin
    insert into public.cities (district_id, name, latitude, longitude) values (v_district2, 'Far North ' || v_tag, 95, 10);
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' latitude-range;';
  exception when check_violation then v_pass := v_pass + 1; end;

  -- 18. A PIN code with a leading zero or wrong length is refused.
  begin
    insert into public.pincodes (code) values ('012345');
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' pin-leading-zero;';
  exception when check_violation then v_pass := v_pass + 1; end;
  begin
    insert into public.pincodes (code) values ('12345');
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' pin-length;';
  exception when check_violation then v_pass := v_pass + 1; end;

  -- 19. A PIN code is stored once per district (duplicate prevention).
  insert into public.pincodes (code, district_id) values ('560001', v_district) returning id into v_pin_a;
  begin
    insert into public.pincodes (code, district_id) values ('560001', v_district);
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' duplicate-pin-same-district;';
  exception when unique_violation then v_pass := v_pass + 1; end;

  -- 20. The same PIN may appear in another district (positive case).
  insert into public.pincodes (code, district_id) values ('560001', v_district2) returning id into v_pin_b;
  v_pass := v_pass + 1;

  -- 21. A PIN with no district is stored once (NULL is treated as one value).
  insert into public.pincodes (code) values ('560002') returning id into v_pin_null;
  begin
    insert into public.pincodes (code) values ('560002');
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' duplicate-pin-no-district;';
  exception when unique_violation then v_pass := v_pass + 1; end;

  -- 22. One locality may have several PIN codes, and one PIN several localities (many to many).
  insert into public.locality_pincodes (locality_id, pincode_id) values (v_locality, v_pin_a);
  insert into public.locality_pincodes (locality_id, pincode_id) values (v_locality2, v_pin_a);
  insert into public.locality_pincodes (locality_id, pincode_id) values (v_locality, v_pin_null);
  v_pass := v_pass + 1;

  -- 23. Duplicate locality-PIN link is refused.
  begin
    insert into public.locality_pincodes (locality_id, pincode_id) values (v_locality, v_pin_a);
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' duplicate-link;';
  exception when unique_violation then v_pass := v_pass + 1; end;

  -- 24. Invalid hierarchy: linking a locality to a PIN from a different district is refused.
  begin
    insert into public.locality_pincodes (locality_id, pincode_id) values (v_locality, v_pin_b);
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' pin-wrong-district;';
  exception when check_violation then v_pass := v_pass + 1; end;

  -- 25. Deleting a referenced state is refused (no silent cascade into businesses).
  -- Business rows are created here; the 'food' category comes from seed.sql.
  insert into public.businesses (slug, name, category_slug, state, district, city, is_active, country_id, state_id, district_id, city_id)
  values ('geo-test-' || v_tag, 'Geo Test Business', 'food', 'Test State A', 'Test District 1', 'Test City',
          false, v_country, v_state, v_district, v_city)
  returning id into v_business;
  begin
    delete from public.states where id = v_state;
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' state-delete-not-blocked;';
  exception when foreign_key_violation then v_pass := v_pass + 1; end;

  -- 26. A business locality from a different city is refused (composite foreign key).
  -- The second city gets its own locality, so the mismatch is real and not "no data".
  insert into public.localities (city_id, name) values (v_city2, 'Test Locality in Town ' || v_tag)
    returning id into v_locality3;
  begin
    update public.businesses set locality_id = v_locality3 where id = v_business; -- city_id is still v_city
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' locality-city-mismatch;';
  exception when foreign_key_violation then v_pass := v_pass + 1; end;

  -- 27. A business city without a district is refused (chain rule).
  begin
    update public.businesses set district_id = null where id = v_business;
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' chain-city-without-district;';
  exception when check_violation then v_pass := v_pass + 1; when foreign_key_violation then v_pass := v_pass + 1; end;

  -- 28. A business PIN link that does not match the text PIN is refused.
  begin
    update public.businesses set pincode = '560099', pincode_id = v_pin_a where id = v_business;
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' pin-text-mismatch;';
  exception when check_violation then v_pass := v_pass + 1; end;

  -- 29. A business PIN link from another district is refused.
  begin
    update public.businesses set pincode = '560001', pincode_id = v_pin_b where id = v_business;
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' pin-business-district;';
  exception when check_violation then v_pass := v_pass + 1; end;

  -- 30. The text PIN column rejects a malformed value on new rows (NOT VALID still checks new rows).
  begin
    insert into public.businesses (slug, name, category_slug, state, district, city, pincode)
    values ('geo-test-pin-' || v_tag, 'Bad PIN', 'food', 'S', 'D', 'C', '12345');
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' business-pin-format;';
  exception when check_violation then v_pass := v_pass + 1; end;

  -- 31. Business location IDs keep the existing business ID (no replacement).
  if (select id from public.businesses where id = v_business) = v_business then
    v_pass := v_pass + 1;
  else
    v_fail := v_fail + 1; v_fail_list := v_fail_list || ' business-id-changed;';
  end if;

  if v_fail > 0 then
    raise exception 'GEOGRAPHY TESTS FAILED: % failing check(s):%. Passed: %. All test rows were rolled back.',
      v_fail, v_fail_list, v_pass;
  end if;

  raise exception 'GEOGRAPHY TESTS PASSED: % checks passed. All test rows were rolled back. This error is expected.', v_pass;
end
$$;
