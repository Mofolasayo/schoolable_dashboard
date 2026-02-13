import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookiesMock = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  cookies: () => cookiesMock(),
}));

import { getAuthToken, getCurrentUser, login } from './actions';

type CookieStore = {
  values: Map<string, string>;
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
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
    delete: vi.fn((name: string) => {
      values.delete(name);
    }),
  };
}

function createLoginFormData() {
  const formData = new FormData();
  formData.set('email', 'user@schoolable.com');
  formData.set('password', 'password123');
  return formData;
}

describe('dashboard login actions', () => {
  let cookieStore: CookieStore;

  beforeEach(() => {
    cookieStore = createCookieStore();
    cookiesMock.mockReturnValue(cookieStore);
  });

  it('throws when required fields are missing', async () => {
    const formData = new FormData();
    formData.set('email', 'user@schoolable.com');

    await expect(login(formData)).rejects.toThrow(
      'Email and password are required'
    );
  });

  it('stores auth cookies on successful login', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          token: 'token-123',
          profile: {
            id: 'user-1',
            employee_id: 'EMP-1',
            email: 'user@schoolable.com',
            full_name: 'Test User',
            role: 'admin',
            gender: 'female',
            avatar_url: 'https://example.com/avatar.png',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await login(createLoginFormData());

    expect(result).toEqual({ ok: true });
    expect(cookieStore.values.get('admin-auth-token')).toBe('token-123');
    const userInfo = cookieStore.values.get('admin-user-info');
    expect(userInfo).toBeDefined();
    expect(JSON.parse(userInfo as string)).toMatchObject({
      id: 'user-1',
      employeeId: 'EMP-1',
      email: 'user@schoolable.com',
      fullName: 'Test User',
      role: 'admin',
      gender: 'female',
      avatarUrl: 'https://example.com/avatar.png',
    });
  });

  it('surfaces API errors', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(login(createLoginFormData())).rejects.toThrow(
      'Invalid credentials'
    );
  });

  it('returns auth token and user info from cookies', async () => {
    cookieStore.values.set('admin-auth-token', 'token-999');
    cookieStore.values.set('admin-user-info', JSON.stringify({ id: 'user-1' }));

    await expect(getAuthToken()).resolves.toBe('token-999');
    await expect(getCurrentUser()).resolves.toMatchObject({ id: 'user-1' });
  });

  it('returns null for invalid user info cookie', async () => {
    cookieStore.values.set('admin-user-info', 'not-json');

    await expect(getCurrentUser()).resolves.toBeNull();
  });
});
