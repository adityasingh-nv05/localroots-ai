// Validation helpers for location import rows. Plain JavaScript (.mjs).
// Each function returns true when the row is acceptable.

/** @param {Record<string, unknown>} row */
export function validateDistrictRow(row) {
  // LGD code should be a non-empty string of digits
  const lgd = String(row.lgd_code ?? '');
  if (!/^\d+$/.test(lgd)) return false;
  // The parent state code must be present (existence is checked against the database later)
  if (!row.state_lgd_code) return false;
  return true;
}

/** @param {Record<string, unknown>} row */
export function validateSettlementRow(row) {
  // A settlement needs a name and a parent district code.
  if (!row.name || !row.district_lgd_code) return false;
  // Latitude and longitude may be empty.
  return true;
}

/** @param {Record<string, unknown>} row */
export function validatePinRow(row) {
  // Exactly 6 digits, and the first digit cannot be 0.
  const code = String(row.pincode ?? '');
  return /^[1-9][0-9]{5}$/.test(code);
}
