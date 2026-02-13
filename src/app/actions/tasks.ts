'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { Task, CreateTaskData } from '@/app/types/tasks';
import { getSuperAdminAvatarUrl, getUserAvatarUrl } from '@/lib/avatar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-auth-token')?.value || null;
  console.log(
    '🔐 Tasks getAuthToken:',
    token ? `Found (${token.substring(0, 20)}...)` : 'NOT FOUND'
  );
  console.log(
    '   All cookies:',
    cookieStore
      .getAll()
      .map((c) => c.name)
      .join(', ')
  );
  return token;
}

function normalizeTaskStatus(status?: string | null): Task['status'] {
  const normalized = (status || '').trim().toUpperCase();
  switch (normalized) {
    case 'DONE':
    case 'COMPLETED':
      return 'DONE';
    case 'IN_PROGRESS':
    case 'IN PROGRESS':
      return 'IN_PROGRESS';
    case 'REVIEW':
      return 'REVIEW';
    case 'CANCELLED':
    case 'CANCELED':
      return 'CANCELLED';
    case 'TODO':
    case 'PENDING':
    default:
      return 'TODO';
  }
}

// Transform backend response to frontend Task type
function transformTask(t: Record<string, unknown>): Task {
  const assignee = t.assignee as Record<string, unknown> | null;
  const assignees = Array.isArray(t.assignees)
    ? (t.assignees as Array<Record<string, unknown>>)
    : [];
  const creator = t.creator as Record<string, unknown> | null;
  const subtasks = (t.subtasks as Array<Record<string, unknown>>) || [];
  const comments = (t.comments as Array<Record<string, unknown>>) || [];
  const attachments = (t.attachments as Array<Record<string, unknown>>) || [];

  const mappedAssignees = assignees.map((item) => {
    const name = (item.full_name as string) || 'Unassigned';
    return {
      id: item.id as string,
      name,
      avatar: getUserAvatarUrl({
        avatar_url: item.avatar_url as string,
        gender: item.gender as string,
        employee_id: item.employee_id as string,
        email: item.email as string,
        full_name: item.full_name as string,
        role: item.role as string,
      }),
      department:
        (item.department as string) || (t.organization as string) || '',
      role: item.role as string | undefined,
    };
  });

  const fallbackAssignee = {
    id: assignee?.id as string,
    name: (assignee?.full_name as string) || 'Unassigned',
    avatar: getUserAvatarUrl({
      avatar_url: assignee?.avatar_url as string,
      gender: assignee?.gender as string,
      employee_id: assignee?.employee_id as string,
      email: assignee?.email as string,
      full_name: assignee?.full_name as string,
      role: assignee?.role as string,
    }),
    department:
      (assignee?.department as string) || (t.organization as string) || '',
  };

  const primaryAssignee =
    mappedAssignees.find((item) => item.role === 'primary') ||
    mappedAssignees[0] ||
    fallbackAssignee;

  return {
    id: t.id as number,
    title: (t.title as string) || '',
    description: (t.description as string) || '',
    assignee: primaryAssignee,
    assignees: mappedAssignees.length > 0 ? mappedAssignees : [primaryAssignee],
    creator: creator
      ? {
          id: creator?.id as string,
          name: (creator?.full_name as string) || 'Admin',
          avatar: getUserAvatarUrl({
            avatar_url: creator?.avatar_url as string,
            gender: creator?.gender as string,
            employee_id: creator?.employee_id as string,
            email: creator?.email as string,
            full_name: creator?.full_name as string,
            role: creator?.role as string,
          }),
        }
      : {
          id: undefined,
          name: 'Admin',
          avatar: getSuperAdminAvatarUrl(),
        },
    organization:
      (t.organization as string) || primaryAssignee.department || '',
    priority: (t.priority as Task['priority']) || 'Medium',
    status: normalizeTaskStatus(t.status as string | undefined),
    dueDate: t.due_date as string,
    tags: (t.tags as string[]) || [],
    progress: (t.progress as number) || 0,
    created: t.created_at as string,
    subtasks: subtasks.map((s) => ({
      id: s.id as number,
      title: s.title as string,
      completed: (s.completed as boolean) || false,
    })),
    attachments: attachments.map((a) => ({
      id: a.id as number,
      name: (a.file_name as string) || '',
      size: (a.file_size as string) || '',
      type: (a.file_type as string) || '',
      url: (a.file_url as string) || '',
    })),
    comments: comments.map((c) => {
      const author = c.author as Record<string, unknown> | null;
      return {
        id: c.id as number,
        author: (author?.full_name as string) || 'Unknown',
        avatar: getUserAvatarUrl({
          avatar_url: author?.avatar_url as string,
          gender: author?.gender as string,
          employee_id: author?.employee_id as string,
          email: author?.email as string,
          full_name: author?.full_name as string,
          role: author?.role as string,
        }),
        text: c.content as string,
        timestamp: c.created_at as string,
      };
    }),
  };
}

export async function getTasks(): Promise<Task[]> {
  const token = await getAuthToken();

  if (!token) {
    console.warn('No auth token for tasks fetch');
    return [];
  }

  try {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Error fetching tasks:', response.status);
      return [];
    }

    const data = await response.json();
    const items = Array.isArray(data) ? data : data?.items || [];
    return (items as Array<Record<string, unknown>>).map(transformTask);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}

export async function createTask(data: CreateTaskData) {
  console.log('📝 createTask called');
  const token = await getAuthToken();
  console.log('📝 Token for createTask:', token ? 'FOUND' : 'NOT FOUND');

  if (!token) {
    console.log('❌ No token found, returning Unauthorized');
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const assigneeIds = (data.assigneeIds || []).filter(Boolean);
    const primaryAssigneeId = data.assignee || assigneeIds[0] || null;

    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        assigneeId: primaryAssigneeId,
        assigneeIds: assigneeIds.length > 0 ? assigneeIds : null,
        organization: data.organization,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        dueTime: data.dueTime || null,
        tags: data.tags,
        subtasks: data.subtasks.map((s) => ({ title: s.title })),
        attachments: data.attachments
          .filter(
            (
              a
            ): a is {
              name: string;
              size: number;
              type: string;
              url: string;
              path: string;
            } => !('lastModified' in a)
          )
          .map((a) => ({
            name: a.name,
            size: a.size.toString(),
            type: a.type,
            url: a.url,
            path: a.path,
          })),
        recurringTemplateId: data.recurringTemplateId || null,
        isRecurringInstance: data.isRecurringInstance ?? null,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Create task error:', error);
      return { success: false, error: error.error || 'Failed to create task' };
    }

    const task = await response.json();
    revalidatePath('/dashboard/tasks');
    return { success: true, taskId: task.id };
  } catch (error) {
    console.error('Create task error:', error);
    return { success: false, error: 'Network error' };
  }
}

export type RecurringTaskTemplateRequest = {
  title: string;
  description?: string;
  defaultPriority?: string;
  defaultAssigneeId?: string;
  organization?: string;
  tags?: string[];
  recurrencePattern: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  recurrenceDay?: number;
  recurrenceDays?: number[];
  dueTime?: string;
  daysUntilDue?: number;
  nextOccurrence?: string;
};

export async function createRecurringTaskTemplate(
  data: RecurringTaskTemplateRequest
) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const normalizeString = (value?: string | null) => {
      if (!value) return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };

    const payload = {
      title: data.title,
      description: normalizeString(data.description),
      defaultPriority: normalizeString(data.defaultPriority),
      defaultAssigneeId: normalizeString(data.defaultAssigneeId),
      organization: normalizeString(data.organization),
      tags: data.tags && data.tags.length > 0 ? data.tags : undefined,
      recurrencePattern: data.recurrencePattern,
      recurrenceDay: data.recurrenceDay ?? undefined,
      recurrenceDays:
        data.recurrenceDays && data.recurrenceDays.length > 0
          ? data.recurrenceDays
          : undefined,
      dueTime: normalizeString(data.dueTime),
      daysUntilDue: data.daysUntilDue,
      nextOccurrence: normalizeString(data.nextOccurrence),
    };

    const response = await fetch(`${API_URL}/tasks/recurring`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to create recurring task';

      try {
        const parsed = JSON.parse(errorText);
        errorMessage = parsed?.error || parsed?.message || errorMessage;
      } catch {
        if (errorText.trim().length > 0) {
          errorMessage = errorText;
        }
      }

      console.error('Create recurring task error:', response.status, errorText);
      return { success: false, error: errorMessage };
    }

    const template = await response.json();
    return { success: true, template };
  } catch (error) {
    console.error('Create recurring task error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function createTaskComment(taskId: number, text: string) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: text }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.error || 'Failed to add comment' };
    }

    revalidatePath('/dashboard/tasks');
    return { success: true };
  } catch (error) {
    console.error('Create comment error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function updateSubtaskStatus(
  subtaskId: number,
  completed: boolean
) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const response = await fetch(`${API_URL}/tasks/subtasks/${subtaskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.error || 'Failed to update subtask',
      };
    }

    revalidatePath('/dashboard/tasks');
    return { success: true };
  } catch (error) {
    console.error('Update subtask error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function recalculateTaskProgress(_taskId: number) {
  // This is now handled automatically by the backend
  // when subtasks are updated
  revalidatePath('/dashboard/tasks');
}

export async function updateTaskDescription(
  taskId: number,
  description: string
) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}/description`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.error || 'Failed to update description',
      };
    }

    revalidatePath('/dashboard/tasks');
    return { success: true };
  } catch (error) {
    console.error('Update description error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function deleteTask(taskId: number) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.error || 'Failed to delete task' };
    }

    revalidatePath('/dashboard/tasks');
    return { success: true };
  } catch (error) {
    console.error('Delete task error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function updateTaskStatus(taskId: number, status: string) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Unauthorized' };
  }

  const normalizedStatus = normalizeTaskStatus(status);
  const progressMap: Record<Task['status'], number> = {
    TODO: 0,
    IN_PROGRESS: 50,
    REVIEW: 80,
    DONE: 100,
    CANCELLED: 0,
  };
  const progress = progressMap[normalizedStatus];

  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: normalizedStatus, progress }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.error || 'Failed to update status',
      };
    }

    revalidatePath('/dashboard/tasks');
    return { success: true };
  } catch (error) {
    console.error('Update status error:', error);
    return { success: false, error: 'Network error' };
  }
}

// ==================== FILE UPLOADS ====================

/**
 * Check if storage service is available
 */
export async function checkStorageStatus(): Promise<{
  available: boolean;
  provider: string;
}> {
  try {
    const response = await fetch(`${API_URL}/storage/status`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      return { available: false, provider: 'none' };
    }

    return await response.json();
  } catch (error) {
    console.error('Storage status check error:', error);
    return { available: false, provider: 'none' };
  }
}

/**
 * Upload a task attachment
 */
export async function uploadTaskAttachment(
  taskId: number,
  file: File
): Promise<{
  success: boolean;
  data?: {
    url: string;
    publicId: string;
    originalFilename: string;
    size: number;
  };
  error?: string;
}> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${API_URL}/storage/tasks/${taskId}/attachment`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.error || 'Failed to upload file' };
    }

    const data = await response.json();
    revalidatePath('/dashboard/tasks');

    return {
      success: true,
      data: {
        url: data.url,
        publicId: data.publicId,
        originalFilename: data.originalFilename || file.name,
        size: data.size || file.size,
      },
    };
  } catch (error) {
    console.error('Upload attachment error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Add an attachment record to a task (using already uploaded file URL)
 */
export async function addTaskAttachment(
  taskId: number,
  attachment: {
    name: string;
    size: string;
    type: string;
    url: string;
    path?: string;
  }
) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(attachment),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.error || 'Failed to add attachment',
      };
    }

    revalidatePath('/dashboard/tasks');
    return { success: true };
  } catch (error) {
    console.error('Add attachment error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Upload and attach a file to a task in one operation
 */
export async function uploadAndAttachFile(
  taskId: number,
  file: File
): Promise<{ success: boolean; error?: string }> {
  // Step 1: Upload the file
  const uploadResult = await uploadTaskAttachment(taskId, file);

  if (!uploadResult.success || !uploadResult.data) {
    return { success: false, error: uploadResult.error || 'Upload failed' };
  }

  // Step 2: Add the attachment record to the task
  const attachResult = await addTaskAttachment(taskId, {
    name: uploadResult.data.originalFilename,
    size: formatFileSize(uploadResult.data.size),
    type: file.type,
    url: uploadResult.data.url,
    path: uploadResult.data.publicId,
  });

  return attachResult;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
