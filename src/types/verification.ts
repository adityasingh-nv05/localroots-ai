/** Verification is granted by admins only. Vendors can request it but never set it. */
export const VERIFICATION_STATUSES = ['unverified', 'pending', 'verified', 'rejected'] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/** Mirrors the `verification_requests` table. */
export interface VerificationRequest {
  id: string;
  business_id: string;
  submitted_by: string | null;
  status: VerificationStatus;
  document_path: string | null;
  reviewer_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
}
