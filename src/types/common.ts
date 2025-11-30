/**
 * Common TypeScript types used across the application
 */

export type ApiSuccessResponse<T> = {
  data: T;
  success: true;
  message?: string;
};

export type ApiErrorResponse = {
  data?: unknown;
  success: false;
  message?: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export const isSuccessResponse = <T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> => response.success === true;

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Generic error response
 */
export interface ErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
