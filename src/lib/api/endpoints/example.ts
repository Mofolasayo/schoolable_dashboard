import { z } from 'zod';

import { apiClient, ApiError } from '../client';
import { userSchema, type User } from '@/lib/schemas';
import type { ApiResponse } from '@/types';
import { isSuccessResponse } from '@/types';

/**
 * Fetches a user by ID
 * @param userId - User ID to fetch
 * @returns Promise with user data
 */
export async function getUser(userId: string): Promise<User> {
  const response = await apiClient<ApiResponse<User>>(`/users/${userId}`);

  if (!isSuccessResponse(response)) {
    throw new ApiError(
      response.message ?? 'Failed to fetch user',
      500,
      response.data
    );
  }

  return userSchema.parse(response.data);
}

/**
 * Fetches all users
 * @returns Promise with array of users
 */
export async function getUsers(): Promise<User[]> {
  const response = await apiClient<ApiResponse<User[]>>('/users');

  if (!isSuccessResponse(response)) {
    throw new ApiError(
      response.message ?? 'Failed to fetch users',
      500,
      response.data
    );
  }

  return z.array(userSchema).parse(response.data);
}
