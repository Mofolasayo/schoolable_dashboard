import { z } from 'zod';

/**
 * Example user schema
 * All data structures should be defined as Zod schemas first
 * TypeScript types are inferred from these schemas
 */
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
});

/**
 * Inferred TypeScript type from the schema
 * This ensures a single source of truth for data structures
 */
export type User = z.infer<typeof userSchema>;

/**
 * Example form schema for user creation
 */
export const createUserFormSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

/**
 * Inferred type for the create user form
 */
export type CreateUserForm = z.infer<typeof createUserFormSchema>;
