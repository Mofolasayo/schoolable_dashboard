import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUser, getUsers } from '../api/endpoints/example';
import type { User } from '../schemas';

/**
 * Query keys for user-related queries
 * Centralized to avoid typos and enable easier refactoring
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

/**
 * Hook to fetch a single user
 * @param userId - User ID to fetch
 * @returns TanStack Query result with user data
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => getUser(userId),
    enabled: !!userId,
  });
}

/**
 * Hook to fetch all users
 * @returns TanStack Query result with users array
 */
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: getUsers,
  });
}

/**
 * Example mutation hook for creating a user
 * Demonstrates optimistic updates and cache invalidation
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: Partial<User>) => {
      // Replace with actual API call
      return userData as User;
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
