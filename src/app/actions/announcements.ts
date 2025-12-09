'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CreateAnnouncementData {
  title: string;
  content: string;
  audience: string;
  pinned: boolean;
  status: 'Published' | 'Draft' | 'Scheduled';
  scheduledAt?: string | null;
}

export type AnnouncementRecord = {
  id: string;
  title: string;
  content: string | null;
  audience: string | null;
  pinned: boolean | null;
  status: 'Published' | 'Draft' | 'Scheduled' | null;
  scheduled_at: string | null;
  created_at: string | null;
  author_id?: string | null;
};

export async function createAnnouncement(data: CreateAnnouncementData) {
  const supabase = await createClient();

  // Get current user (author)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase.from('announcements').insert({
    title: data.title,
    content: data.content,
    audience: data.audience,
    pinned: data.pinned,
    author_id: user.id,
    status: data.status,
    scheduled_at: data.scheduledAt, // Ensure DB has this column
  });

  if (error) {
    console.error('Error creating announcement:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/announcements');
  return { success: true };
}

// ... (existing imports and createAnnouncement) ...

export async function updateAnnouncement(
  id: string,
  data: Partial<CreateAnnouncementData>
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const updates: Partial<AnnouncementRecord> = {
    title: data.title,
    content: data.content,
    audience: data.audience,
    pinned: data.pinned ?? null,
    status: data.status ?? null,
    scheduled_at: data.scheduledAt ?? null,
  };

  const { error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating announcement:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/announcements');
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('announcements').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/announcements');
  return { success: true };
}

export async function getAnnouncements(): Promise<AnnouncementRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }

  // Auto-publish scheduled announcements that are due
  const now = new Date();
  const toPublish = (data || []).filter(
    (a: AnnouncementRecord) =>
      a.status === 'Scheduled' &&
      a.scheduled_at &&
      new Date(a.scheduled_at) <= now
  );

  if (toPublish.length > 0) {
    const ids = toPublish.map((a: AnnouncementRecord) => a.id);
    // Fire and forget update (or await if critical)
    await supabase
      .from('announcements')
      .update({ status: 'Published' })
      .in('id', ids);

    // Optimistically update local data
    data?.forEach((a: AnnouncementRecord) => {
      if (ids.includes(a.id)) {
        a.status = 'Published';
      }
    });
  }

  return data;
}
