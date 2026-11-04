/** A Karnataka location shown on the explore page. Matching is by city or district. */
export interface KarnatakaLocation {
  slug: string;
  name: string;
  description: string;
  cities: readonly string[];
  districts: readonly string[];
  latitude: number;
  longitude: number;
}
