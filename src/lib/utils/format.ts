/** Format a numeric rating to one decimal place */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/** Capitalise the first letter of a string */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Convert a snake_case category key to a display label */
export function categoryLabel(category: string): string {
  return category
    .split('_')
    .map(capitalize)
    .join(' ');
}
