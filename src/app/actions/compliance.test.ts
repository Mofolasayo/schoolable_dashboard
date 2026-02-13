import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookiesMock = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  cookies: () => cookiesMock(),
}));

import {
  createCompliancePolicy,
  deleteCompliancePolicy,
  getComplianceMetrics,
  getCompliancePolicies,
  reviewComplianceSubmission,
  updateCompliancePolicy,
} from './compliance';

type CookieStore = {
  values: Map<string, string>;
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
};

function createCookieStore(): CookieStore {
  const values = new Map<string, string>();

  return {
    values,
    set: vi.fn((name: string, value: string) => {
      values.set(name, value);
    }),
    get: vi.fn((name: string) => {
      const value = values.get(name);
      return value ? { name, value } : undefined;
    }),
  };
}

describe('dashboard compliance actions', () => {
  let cookieStore: CookieStore;

  beforeEach(() => {
    cookieStore = createCookieStore();
    cookiesMock.mockReturnValue(cookieStore);
  });

  it('returns empty policies list when token is missing', async () => {
    const result = await getCompliancePolicies();

    expect(result).toEqual([]);
  });

  it('returns null metrics when token is missing', async () => {
    const result = await getComplianceMetrics();

    expect(result).toBeNull();
  });

  it('creates a compliance policy', async () => {
    cookieStore.values.set('admin-auth-token', 'token-123');

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'policy-1', title: 'Policy' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await createCompliancePolicy({
      title: 'Policy',
      category: 'Data Security',
      description: 'Policy description',
      type: 'policy',
      reviewFrequencyDays: 90,
    });

    expect(result).toEqual({
      success: true,
      data: { id: 'policy-1', title: 'Policy' },
    });
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/compliance/policies`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    );
  });

  it('updates a compliance policy', async () => {
    cookieStore.values.set('admin-auth-token', 'token-123');

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await updateCompliancePolicy('policy-1', {
      title: 'Updated Policy',
    });

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/compliance/policies/policy-1`,
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    );
  });

  it('deletes a compliance policy', async () => {
    cookieStore.values.set('admin-auth-token', 'token-123');

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await deleteCompliancePolicy('policy-1');

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/compliance/policies/policy-1`,
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    );
  });

  it('reviews a compliance submission', async () => {
    cookieStore.values.set('admin-auth-token', 'token-123');

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await reviewComplianceSubmission('submission-1', 'approved');

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/compliance/submissions/submission-1/review`,
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    );
  });
});
