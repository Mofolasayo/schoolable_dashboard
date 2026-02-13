import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookiesMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock('next/headers', () => ({
  cookies: () => cookiesMock(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

import { createTask, uploadAndAttachFile, uploadTaskAttachment } from './tasks';

type CookieStore = {
  values: Map<string, string>;
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  getAll: ReturnType<typeof vi.fn>;
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
    getAll: vi.fn(() => {
      return Array.from(values.entries()).map(([name, value]) => ({
        name,
        value,
      }));
    }),
  };
}

describe('dashboard task actions', () => {
  let cookieStore: CookieStore;

  beforeEach(() => {
    cookieStore = createCookieStore();
    cookiesMock.mockReturnValue(cookieStore);
    revalidatePathMock.mockClear();
  });

  it('returns unauthorized when creating a task without auth', async () => {
    const result = await createTask({
      title: 'Task',
      description: 'Do the thing',
      assignee: 'user-1',
      organization: 'Engineering',
      priority: 'High',
      dueDate: '2030-01-01T10:00:00.000Z',
      tags: [],
      subtasks: [],
      attachments: [],
    });

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it('creates and assigns a task with payload mapping', async () => {
    cookieStore.values.set('admin-auth-token', 'token-123');

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 42 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await createTask({
      title: 'Assign task',
      description: 'Assign to staff',
      assignee: 'user-1',
      assigneeIds: ['user-1'],
      organization: 'Engineering',
      priority: 'Medium',
      dueDate: '2030-01-01T10:00:00.000Z',
      tags: ['ops'],
      subtasks: [{ title: 'Prep' }],
      attachments: [
        {
          name: 'spec.pdf',
          size: 1200,
          type: 'application/pdf',
          url: 'https://example.com/spec.pdf',
          path: 'tasks/spec.pdf',
        },
      ],
    });

    expect(result).toEqual({ success: true, taskId: 42 });
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/tasks`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    );

    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(options?.body as string);

    expect(body).toMatchObject({
      assigneeId: 'user-1',
      assigneeIds: ['user-1'],
      organization: 'Engineering',
      priority: 'Medium',
      tags: ['ops'],
    });
    expect(body.dueDate).toBe('2030-01-01T10:00:00.000Z');
    expect(body.attachments[0]).toMatchObject({
      name: 'spec.pdf',
      size: '1200',
      type: 'application/pdf',
      url: 'https://example.com/spec.pdf',
      path: 'tasks/spec.pdf',
    });
    expect(revalidatePathMock).toHaveBeenCalledWith('/dashboard/tasks');
  });

  it('returns unauthorized when uploading task attachment without auth', async () => {
    const file = new File(['hello'], 'doc.txt', { type: 'text/plain' });

    const result = await uploadTaskAttachment(1, file);

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('uploads and attaches a task document', async () => {
    cookieStore.values.set('admin-auth-token', 'token-123');

    vi.mocked(global.fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            url: 'https://cdn.example.com/doc.pdf',
            publicId: 'tasks/doc.pdf',
            originalFilename: 'doc.pdf',
            size: 2048,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    const file = new File(['content'], 'doc.pdf', {
      type: 'application/pdf',
    });

    const result = await uploadAndAttachFile(1, file);

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/storage/tasks/1/attachment`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/tasks/1/attachments`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    );
  });
});
