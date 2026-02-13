import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookiesMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  cookies: () => cookiesMock(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from './announcements';

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

describe('dashboard announcement actions', () => {
  let cookieStore: CookieStore;

  beforeEach(() => {
    cookieStore = createCookieStore();
    cookiesMock.mockReturnValue(cookieStore);
    revalidatePathMock.mockClear();
  });

  it('returns not authenticated when token is missing', async () => {
    const result = await createAnnouncement({
      title: 'Update',
      content: 'Hello team',
      audience: 'All Staff',
      pinned: false,
      status: 'Published',
    });

    expect(result).toEqual({ success: false, error: 'Not authenticated' });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it('creates announcement and revalidates path', async () => {
    cookieStore.values.set('admin-auth-token', 'token-123');

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'ann-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await createAnnouncement({
      title: 'Update',
      content: 'Hello team',
      audience: 'All Staff',
      pinned: true,
      status: 'Published',
    });

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/announcements`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard/announcements');
  });

  it('returns API error response when request fails', async () => {
    cookieStore.values.set('admin-auth-token', 'token-123');

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Failed to create' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await createAnnouncement({
      title: 'Update',
      content: 'Hello team',
      audience: 'All Staff',
      pinned: false,
      status: 'Draft',
    });

    expect(result).toEqual({
      success: false,
      error: 'Failed to create',
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it('creates a scheduled announcement for later publishing', async () => {
    cookieStore.values.set('admin-auth-token', 'token-123');

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'ann-2' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const scheduledAt = '2030-01-01T09:00:00.000Z';
    const result = await createAnnouncement({
      title: 'Scheduled Update',
      content: 'Hello later',
      audience: 'All Staff',
      pinned: false,
      status: 'Scheduled',
      scheduledAt,
    });

    expect(result).toEqual({ success: true });
    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(options?.body as string);
    expect(body).toMatchObject({
      status: 'Scheduled',
      scheduledAt,
    });
  });

  it('updates an announcement and revalidates path', async () => {
    cookieStore.values.set('admin-auth-token', 'token-123');

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'ann-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await updateAnnouncement('ann-1', {
      title: 'Updated title',
      status: 'Published',
    });

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/announcements/ann-1`,
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard/announcements');
  });

  it('deletes an announcement and revalidates path', async () => {
    cookieStore.values.set('admin-auth-token', 'token-123');

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await deleteAnnouncement('ann-1');

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/announcements/ann-1`,
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    );
    expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard/announcements');
  });

  it('auto-publishes scheduled announcements when due', async () => {
    cookieStore.values.set('admin-auth-token', 'token-123');

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: 'ann-1',
            title: 'Past',
            status: 'Scheduled',
            scheduled_at: '2000-01-01T00:00:00.000Z',
          },
          {
            id: 'ann-2',
            title: 'Future',
            status: 'Scheduled',
            scheduled_at: '2999-01-01T00:00:00.000Z',
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await getAnnouncements();

    const past = result.find((announcement) => announcement.id === 'ann-1');
    const future = result.find((announcement) => announcement.id === 'ann-2');

    expect(past?.status).toBe('Published');
    expect(future?.status).toBe('Scheduled');
  });
});
