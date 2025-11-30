import { z } from 'zod';

/**
 * Environment variables schema for runtime validation
 * This ensures that all required environment variables are present and valid
 */
const envSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_ENABLE_DEV_TOOLS: z
    .string()
    .transform((val) => val === 'true')
    .optional()
    .default('false'),
});

/**
 * Validates and parses environment variables
 * Throws an error if validation fails
 */
function validateEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ENABLE_DEV_TOOLS: process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS,
  });

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten());
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

/**
 * Type-safe environment variables
 * Validated at application startup
 */
export const env = validateEnv();

/**
 * Inferred TypeScript type for environment variables
 */
export type Env = z.infer<typeof envSchema>;
