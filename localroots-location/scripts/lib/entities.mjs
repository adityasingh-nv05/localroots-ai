/**
 * Column rules for each location entity, and per-row validation.
 *
 * These rules mirror the database constraints in migration 0004. The database remains the
 * final authority; this file catches problems early and explains them to a person.
 *
 * Input files use this normalised layout. Official LGD exports must be converted to it
 * before import, and that conversion must be checked against the real file (not done yet).
 */

export const ENTITY_NAMES = ['states', 'districts', 'cities', 'localities'];

const EXTERNAL_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const STATE_CODE = /^[A-Z0-9]{1,10}$/;
const DISTRICT_CODE = /^[A-Z0-9]{1,15}$/;

export const ENTITIES = {
  states: {
    table: 'states',
    required: ['external_id', 'name', 'kind', 'country_iso'],
    optional: ['code', 'latitude', 'longitude'],
    parentField: null,
  },
  districts: {
    table: 'districts',
    required: ['external_id', 'name', 'state_external_id'],
    optional: ['code', 'latitude', 'longitude'],
    parentField: 'state_external_id',
  },
  cities: {
    table: 'cities',
    required: ['external_id', 'name', 'district_external_id', 'kind'],
    optional: ['latitude', 'longitude'],
    parentField: 'district_external_id',
  },
  localities: {
    table: 'localities',
    required: ['external_id', 'name', 'city_external_id'],
    optional: ['latitude', 'longitude'],
    parentField: 'city_external_id',
  },
};

export function getEntity(name) {
  const entity = ENTITIES[name];
  if (!entity) throw new Error(`Unknown entity "${name}". Use one of: ${ENTITY_NAMES.join(', ')}.`);
  return entity;
}

export function requiredColumnsFor(name) {
  return getEntity(name).required;
}

function parseCoordinate(value) {
  if (value === undefined || value === '') return { value: null, error: null };
  const n = Number(value);
  if (!Number.isFinite(n)) return { value: null, error: `"${value}" is not a number.` };
  return { value: n, error: null };
}

/** Returns a list of problems with one row. An empty list means the row is acceptable. */
export function validateRow(name, row) {
  const entity = getEntity(name);
  const errors = [];

  for (const column of entity.required) {
    if (!row[column]) errors.push(`${column} is required.`);
  }

  if (row.external_id && !EXTERNAL_ID.test(row.external_id)) {
    errors.push('external_id may contain letters, digits, dots, underscores and hyphens only (up to 100 characters).');
  }
  if (row.name && (row.name.length > 200)) errors.push('name must be 200 characters or fewer.');
  if (entity.parentField && row[entity.parentField] && !EXTERNAL_ID.test(row[entity.parentField])) {
    errors.push(`${entity.parentField} is not a valid identifier.`);
  }

  if (name === 'states') {
    if (row.kind && !['state', 'union_territory'].includes(row.kind)) {
      errors.push('kind must be "state" or "union_territory".');
    }
    if (row.country_iso && row.country_iso !== 'IN') {
      errors.push('Only India (IN) is supported in this build.');
    }
    if (row.code && !STATE_CODE.test(row.code)) errors.push('code must be 1 to 10 uppercase letters or digits.');
  }

  if (name === 'districts' && row.code && !DISTRICT_CODE.test(row.code)) {
    errors.push('code must be 1 to 15 uppercase letters or digits.');
  }

  if (name === 'cities' && row.kind && !['metro', 'city', 'town', 'village'].includes(row.kind)) {
    errors.push('kind must be metro, city, town or village.');
  }

  const lat = parseCoordinate(row.latitude);
  const lng = parseCoordinate(row.longitude);
  if (lat.error) errors.push(`latitude: ${lat.error}`);
  if (lng.error) errors.push(`longitude: ${lng.error}`);
  if (lat.value !== null && (lat.value < -90 || lat.value > 90)) errors.push('latitude must be between -90 and 90.');
  if (lng.value !== null && (lng.value < -180 || lng.value > 180)) errors.push('longitude must be between -180 and 180.');
  if ((lat.value === null) !== (lng.value === null)) errors.push('latitude and longitude must be given together.');

  return errors;
}

export function coordinateOf(row) {
  const lat = parseCoordinate(row.latitude).value;
  const lng = parseCoordinate(row.longitude).value;
  return { latitude: lat, longitude: lng };
}
