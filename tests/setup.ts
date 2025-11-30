import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';

/**
 * Provide safe defaults for required NEXT_PUBLIC variables so env validation
 * doesn't explode when Vitest spins up without a .env file.
 */
const envFallbacks: Record<string, string> = {
  NEXT_PUBLIC_APP_NAME: 'Allpro NextJS Boilerplate',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_API_URL: 'http://localhost:8000/api',
  NEXT_PUBLIC_ENABLE_DEV_TOOLS: 'false',
};

Object.entries(envFallbacks).forEach(([key, value]) => {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
});

/**
 * Global fetch stub so example tests don't try to reach a real backend.
 * Individual tests can override this mock when they need different data.
 */
const mockUsers = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'jane.doe@example.com',
    name: 'Jane Doe',
    createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
  },
];

const mockedFetch = vi.fn();

beforeAll(() => {
  vi.stubGlobal('fetch', mockedFetch);
});

beforeEach(() => {
  mockedFetch.mockResolvedValue(
    new Response(
      JSON.stringify({
        data: mockUsers,
        success: true,
        message: 'Fetched users successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

/**
 * Cleanup after each test
 * Ensures no memory leaks and fresh state for each test
 */
afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});
