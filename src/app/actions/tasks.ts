'use server';

import { createClient } from '@/lib/supabase/server';
import { Task, CreateTaskData } from '@/app/types/tasks';
import { revalidatePath } from 'next/cache';

type ProfileSummary = {
  full_name?: string | null;
  department?: string | null;
  avatar_url?: string | null;
  gender?: string | null;
  email?: string | null;
  employee_id?: string | null;
};

type SubtaskRow = {
  id: number;
  title: string;
  completed: boolean;
  task_id: number;
};
type AttachmentRow = {
  id: number;
  file_name: string;
  file_size: string;
  file_type: string;
  file_url: string;
  file_path?: string;
};
type CommentRow = {
  id: number;
  content: string;
  created_at: string;
  author?: ProfileSummary | null;
};

type TaskRow = {
  id: number;
  title: string;
  description: string;
  assignee?: ProfileSummary | null;
  organization?: string | null;
  priority: Task['priority'];
  status: Task['status'];
  due_date: string | null;
  tags?: string[] | null;
  progress?: number | null;
  created_at: string;
  subtasks?: SubtaskRow[] | null;
  attachments?: AttachmentRow[] | null;
  comments?: CommentRow[] | null;
};

export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient();

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(
      `
      *,
      assignee:assignee_id(full_name, department, avatar_url, gender, email, employee_id),
      subtasks:task_subtasks(*),
      attachments:task_attachments(*),
      comments:task_comments(
        *,
        author:user_id(full_name, avatar_url, gender, email, employee_id)
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }

  const rows: TaskRow[] = (tasks as TaskRow[]) || [];

  // Map to frontend Task type
  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    assignee: {
      name: t.assignee?.full_name || 'Unassigned',
      avatar:
        t.assignee?.avatar_url ||
        `https://api.dicebear.com/7.x/${
          t.assignee?.gender?.toLowerCase() === 'male'
            ? 'adventurer'
            : t.assignee?.gender?.toLowerCase() === 'female'
              ? 'adventurer-neutral'
              : 'bottts'
        }/svg?seed=${t.assignee?.employee_id || t.assignee?.email || t.assignee?.full_name || 'User'}`,
      department: t.assignee?.department || t.organization || '',
    },
    organization: t.organization || t.assignee?.department || '',
    priority: t.priority,
    status: t.status,
    dueDate: t.due_date,
    tags: t.tags || [],
    progress: t.progress || 0,
    created: t.created_at,
    subtasks:
      t.subtasks?.map((s: SubtaskRow) => ({
        id: s.id,
        title: s.title,
        completed: s.completed,
      })) || [],
    attachments:
      t.attachments?.map((a: AttachmentRow) => ({
        id: a.id,
        name: a.file_name,
        size: a.file_size,
        type: a.file_type,
        url: a.file_url,
      })) || [],
    comments:
      t.comments?.map((c: CommentRow) => ({
        id: c.id,
        author: c.author?.full_name || 'Unknown',
        avatar:
          c.author?.avatar_url ||
          `https://api.dicebear.com/7.x/${
            c.author?.gender?.toLowerCase() === 'male'
              ? 'adventurer'
              : c.author?.gender?.toLowerCase() === 'female'
                ? 'adventurer-neutral'
                : 'bottts'
          }/svg?seed=${c.author?.employee_id || c.author?.email || c.author?.full_name || 'User'}`,
        text: c.content,
        timestamp: c.created_at,
      })) || [],
  }));
}

export async function createTask(data: CreateTaskData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  // 1. Assignee ID is passed directly
  const assigneeId = data.assignee || null;

  // 2. Insert Task
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title: data.title,
      description: data.description,
      assignee_id: assigneeId,
      organization: data.organization,
      priority: data.priority,
      status: 'Pending',
      due_date: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      tags: data.tags,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Create task error:', error);
    return { success: false, error: error.message };
  }

  // 3. Insert Subtasks
  if (data.subtasks && data.subtasks.length > 0) {
    const subtasksData = data.subtasks.map((s) => ({
      task_id: task.id,
      title: s.title,
      completed: false,
    }));
    const { error: subError } = await supabase
      .from('task_subtasks')
      .insert(subtasksData);
    if (subError) console.error('Subtask create error:', subError);
  }

  // 4. Handle Attachments (Metadata passed from client)
  if (data.attachments && data.attachments.length > 0) {
    const attachmentsData = data.attachments
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
        task_id: task.id,
        file_name: a.name,
        file_size: a.size.toString(),
        file_type: a.type,
        file_url: a.url,
        file_path: a.path,
      }));

    if (attachmentsData.length > 0) {
      const { error: attachError } = await supabase
        .from('task_attachments')
        .insert(attachmentsData);
      if (attachError) console.error('Attachment create error:', attachError);
    }
  }

  revalidatePath('/dashboard/tasks');
  return { success: true, taskId: task.id };
}

export async function createTaskComment(taskId: number, text: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('task_comments').insert({
    task_id: taskId,
    user_id: user.id,
    content: text,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/tasks');
  return { success: true };
}

export async function updateSubtaskStatus(
  subtaskId: number,
  completed: boolean
) {
  const supabase = await createClient();

  // 1. Update Subtask
  const { error } = await supabase
    .from('task_subtasks')
    .update({ completed })
    .eq('id', subtaskId);

  if (error) return { success: false, error: error.message };

  // 2. Recalculate Parent Task Progress
  // We need to fetch the task_id first, but ideally we passed it.
  // Let's do a subquery or fetch.
  const { data: subtask } = await supabase
    .from('task_subtasks')
    .select('task_id')
    .eq('id', subtaskId)
    .single();

  if (subtask) {
    await recalculateTaskProgress(subtask.task_id);
  }

  revalidatePath('/dashboard/tasks');
  return { success: true };
}

export async function recalculateTaskProgress(taskId: number) {
  const supabase = await createClient();

  // Count total and completed subtasks
  const { data: subtasks } = await supabase
    .from('task_subtasks')
    .select('completed')
    .eq('task_id', taskId);

  if (!subtasks || subtasks.length === 0) return;

  const total = subtasks.length;
  const completed = subtasks.filter((s) => s.completed).length;
  const progress = Math.round((completed / total) * 100);

  // Update task progress
  await supabase
    .from('tasks')
    .update({
      progress,
      status:
        progress === 100
          ? 'Completed'
          : progress > 0
            ? 'In Progress'
            : 'Pending',
    })
    .eq('id', taskId);
}

export async function updateTaskDescription(
  taskId: number,
  description: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update({ description })
    .eq('id', taskId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/tasks');
  return { success: true };
}

export async function deleteTask(taskId: number) {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/tasks');
  return { success: true };
}

export async function updateTaskStatus(taskId: number, status: string) {
  const supabase = await createClient();

  // If completing, set progress to 100, else 0 (simplification for Manual Toggle)
  // NOTE: If subtasks exist, progress usually depends on them, but manual override is fine.
  const progress = status === 'Completed' ? 100 : 0;

  const { error } = await supabase
    .from('tasks')
    .update({ status, progress })
    .eq('id', taskId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/tasks');
  return { success: true };
}
