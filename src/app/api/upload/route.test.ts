import { beforeEach, describe, expect, it, vi } from 'vitest';
const cookiesMock = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  cookies: () => cookiesMock(),
}));

import { POST } from './route';

type CookieStore = {
  values: Map<string, string>;
  get: ReturnType<typeof vi.fn>;
};

function createCookieStore(): CookieStore {
  const values = new Map<string, string>();

  return {
    values,
    get: vi.fn((name: string) => {
      const value = values.get(name);
      return value ? { name, value } : undefined;
    }),
  };
}

describe('dashboard upload route', () => {
  let cookieStore: CookieStore;

  beforeEach(() => {
    cookieStore = createCookieStore();
    cookiesMock.mockReturnValue(cookieStore);
  });

  it('returns unauthorized when token is missing', async () => {
    const formData = { get: () => null } as unknown as FormData;
    const request = {
      nextUrl: new URL('http://localhost/api/upload?folder=tasks'),
      formData: async () => formData,
    } as unknown as Request;

    const response = await POST(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Unauthorized',
    });
  });

  it('returns bad request when file is missing', async () => {
    cookieStore.values.set('admin-auth-token', 'token-123');

    const formData = { get: () => null } as unknown as FormData;
    const request = {
      nextUrl: new URL('http://localhost/api/upload?folder=tasks'),
      formData: async () => formData,
    } as unknown as Request;

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'No file provided',
    });
  });

  it('uploads document to backend storage', async () => {
    cookieStore.values.set('admin-auth-token', 'token-123');

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ url: 'https://cdn.example.com/doc.pdf' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const file = Object.assign(
      new Blob(['content'], { type: 'application/pdf' }),
      {
        name: 'doc.pdf',
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      }
    );
    const formData = { get: () => file } as unknown as FormData;

    const request = {
      nextUrl: new URL('http://localhost/api/upload?folder=tasks'),
      formData: async () => formData,
    } as unknown as Request;

    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      url: 'https://cdn.example.com/doc.pdf',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/storage/upload?folder=tasks`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer token-123',
        },
      })
    );
  });
});
