/** Generic result wrapper for route handlers and server actions. */
export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
