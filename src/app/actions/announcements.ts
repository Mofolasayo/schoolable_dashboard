'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

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
  is_read?: boolean;
};

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('auth-token')?.value || null;
}

export async function createAnnouncement(data: CreateAnnouncementData) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const response = await fetch(`${API_URL}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Error creating announcement:', error);
      return { success: false, error: error.error || 'Failed to create announcement' };
    }

    revalidatePath('/dashboard/announcements');
    return { success: true };
  } catch (error) {
    console.error('Error creating announcement:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function updateAnnouncement(
  id: string,
  data: Partial<CreateAnnouncementData>
) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const response = await fetch(`${API_URL}/announcements/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Error updating announcement:', error);
      return { success: false, error: error.error || 'Failed to update announcement' };
    }

    revalidatePath('/dashboard/announcements');
    return { success: true };
  } catch (error) {
    console.error('Error updating announcement:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function deleteAnnouncement(id: string) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const response = await fetch(`${API_URL}/announcements/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.error || 'Failed to delete announcement' };
    }

    revalidatePath('/dashboard/announcements');
    return { success: true };
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function getAnnouncements(): Promise<AnnouncementRecord[]> {
  const token = await getAuthToken();

  if (!token) {
    console.warn('No auth token for announcements fetch');
    return [];
  }

  try {
    const response = await fetch(`${API_URL}/announcements`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Error fetching announcements:', response.status);
      return [];
    }

    const data: AnnouncementRecord[] = await response.json();

    // Auto-publish scheduled announcements that are due (client-side check)
    const now = new Date();
    return data.map((a) => {
      if (
        a.status === 'Scheduled' &&
        a.scheduled_at &&
        new Date(a.scheduled_at) <= now
      ) {
        return { ...a, status: 'Published' as const };
      }
      return a;
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
}

export async function markAnnouncementAsRead(id: string) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const response = await fetch(`${API_URL}/announcements/${id}/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.error || 'Failed to mark as read' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    return { success: false, error: 'Network error' };
  }
}
