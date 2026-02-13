import { config } from '@/config';
import { logger } from '@/lib/logger';

/**
 * API client error class for type-safe error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic API client for making HTTP requests
 * @param endpoint - API endpoint path
 * @param options - Fetch options
 * @returns Promise with response data
 * @throws ApiError on request failure
 */
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${config.api.baseUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      logger.warn('API request failed', {
        endpoint,
        status: response.status,
      });
      throw new ApiError(
        error.message || 'An error occurred',
        response.status,
        error
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error('API request error', { endpoint, error });
    throw new ApiError('Network error', 0, error);
  }
}
