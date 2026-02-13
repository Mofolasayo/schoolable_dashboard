/* eslint-disable no-console */
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

const ENV_FILES = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
] as const;

ENV_FILES.forEach((file) => {
  const location = resolve(process.cwd(), file);
  if (existsSync(location)) {
    loadEnv({ path: location, override: true });
  }
});

const booleanFlag = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const envSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z
    .string()
    .min(1, 'NEXT_PUBLIC_APP_NAME cannot be empty')
    .default('Allpro NextJS Boilerplate'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url(
      'NEXT_PUBLIC_APP_URL must be an absolute URL, e.g. http://localhost:3000'
    )
    .default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z
    .string()
    .url('NEXT_PUBLIC_API_URL must be an absolute URL'),
  NEXT_PUBLIC_ENABLE_DEV_TOOLS: booleanFlag,
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Environment validation failed:\n');
  for (const issue of result.error.issues) {
    console.error(` • ${issue.path.join('.') || 'root'}: ${issue.message}`);
  }
  console.error(
    '\nCreate a .env.local file based on .env.example and re-run `npm run env:check`.'
  );
  process.exit(1);
}

console.log(
  '✅ Environment variables look good for Allpro NextJS Boilerplate.'
);
console.log(
  `   → App name: ${result.data.NEXT_PUBLIC_APP_NAME}\n` +
    `   → App URL: ${result.data.NEXT_PUBLIC_APP_URL}\n` +
    `   → API URL: ${result.data.NEXT_PUBLIC_API_URL ?? 'not configured'}\n` +
    `   → Dev tools enabled: ${result.data.NEXT_PUBLIC_ENABLE_DEV_TOOLS}`
);
