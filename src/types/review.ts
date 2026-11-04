/** Mirrors the `reviews` table plus the reviewer display name, which comes from get_review_authors(). One review per user per business. */
export interface Review {
  id: string;
  business_id: string;
  user_id: string;
  user_name: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  created_at: string;
}
