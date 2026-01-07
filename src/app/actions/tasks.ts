'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { Task, CreateTaskData } from '@/app/types/tasks';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin-auth-token')?.value || null;
  console.log('🔐 Tasks getAuthToken:', token ? `Found (${token.substring(0, 20)}...)` : 'NOT FOUND');
  console.log('   All cookies:', cookieStore.getAll().map(c => c.name).join(', '));
  return token;
}

// Helper to generate avatar URL
function generateAvatarUrl(profile: {
  gender?: string | null;
  employee_id?: string | null;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
}): string {
  if (profile.avatar_url) return profile.avatar_url;

  const gender = profile.gender?.toLowerCase();
  let style = 'bottts';
  if (gender === 'male') style = 'adventurer';
  else if (gender === 'female') style = 'adventurer-neutral';

  const seed = profile.employee_id || profile.email || profile.full_name || 'User';
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

// Transform backend response to frontend Task type
function transformTask(t: Record<string, unknown>): Task {
  const assignee = t.assignee as Record<string, unknown> | null;
  const subtasks = (t.subtasks as Array<Record<string, unknown>>) || [];
  const comments = (t.comments as Array<Record<string, unknown>>) || [];
  const attachments = (t.attachments as Array<Record<string, unknown>>) || [];

  return {
    id: t.id as number,
    title: (t.title as string) || '',
    description: (t.description as string) || '',
    assignee: {
      id: assignee?.id as string,
      name: (assignee?.full_name as string) || 'Unassigned',
      avatar: generateAvatarUrl({
        avatar_url: assignee?.avatar_url as string,
        gender: assignee?.gender as string,
        employee_id: assignee?.employee_id as string,
        email: assignee?.email as string,
        full_name: assignee?.full_name as string,
      }),
      department: (assignee?.department as string) || (t.organization as string) || '',
    },
    organization: (t.organization as string) || (assignee?.department as string) || '',
    priority: (t.priority as Task['priority']) || 'Medium',
    status: (t.status as Task['status']) || 'Pending',
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
        avatar: generateAvatarUrl({
          avatar_url: author?.avatar_url as string,
          gender: author?.gender as string,
          employee_id: author?.employee_id as string,
          email: author?.email as string,
          full_name: author?.full_name as string,
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
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Error fetching tasks:', response.status);
      return [];
    }

    const data = await response.json();
    return (data as Array<Record<string, unknown>>).map(transformTask);
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
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        assigneeId: data.assignee || null,
        organization: data.organization,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        tags: data.tags,
        subtasks: data.subtasks.map((s) => ({ title: s.title })),
        attachments: data.attachments
          .filter((a): a is { name: string; size: number; type: string; url: string; path: string } =>
            !('lastModified' in a)
          )
          .map((a) => ({
            name: a.name,
            size: a.size.toString(),
            type: a.type,
            url: a.url,
            path: a.path,
          })),
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
        'Authorization': `Bearer ${token}`,
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

export async function updateSubtaskStatus(subtaskId: number, completed: boolean) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const response = await fetch(`${API_URL}/tasks/subtasks/${subtaskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ completed }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.error || 'Failed to update subtask' };
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

export async function updateTaskDescription(taskId: number, description: string) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}/description`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.error || 'Failed to update description' };
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
        'Authorization': `Bearer ${token}`,
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

  // Set progress based on status
  const progress = status === 'Completed' ? 100 : status === 'Pending' ? 0 : undefined;

  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status, progress }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.error || 'Failed to update status' };
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
export async function checkStorageStatus(): Promise<{ available: boolean; provider: string }> {
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
  data?: { url: string; publicId: string; originalFilename: string; size: number };
  error?: string;
}> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/storage/tasks/${taskId}/attachment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

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
  attachment: { name: string; size: string; type: string; url: string; path?: string }
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
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(attachment),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.error || 'Failed to add attachment' };
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

