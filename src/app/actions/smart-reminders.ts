'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('admin-auth-token')?.value || null;
}

export interface SmartReminder {
  id: string;
  name: string;
  description: string;
  type:
    | 'check_in'
    | 'task_due'
    | 'report_submission'
    | 'peer_feedback'
    | 'aura_penalty'
    | 'custom';
  schedule: {
    time: string;
    days: string[];
    timezone: string;
  };
  targetAudience: 'all' | 'pending_only' | 'specific_team' | 'specific_users';
  message: string;
  channels: ('push' | 'email' | 'sms')[];
  isActive: boolean;
  lastTriggered?: string;
  triggerCount: number;
  createdAt: string;
}

export interface SmartReminderPayload {
  name: string;
  description: string;
  type: string;
  scheduleTime: string;
  scheduleDays: string[];
  timezone: string;
  targetAudience: string;
  message: string;
  channels: string[];
}

export async function getSmartReminders(): Promise<{
  reminders: SmartReminder[];
  summary: { total: number; active: number };
}> {
  const token = await getAuthToken();

  if (!token) {
    console.warn('No auth token for smart reminders');
    return { reminders: [], summary: { total: 0, active: 0 } };
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/smart-reminders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Error fetching smart reminders:', response.status);
      return { reminders: [], summary: { total: 0, active: 0 } };
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching smart reminders:', error);
    return { reminders: [], summary: { total: 0, active: 0 } };
  }
}

export async function createSmartReminder(
  payload: SmartReminderPayload
): Promise<{ success: boolean; reminder?: SmartReminder; error?: string }> {
  const token = await getAuthToken();

  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch(`${API_URL}/api/admin/smart-reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.error || error.message || 'Failed to create reminder',
      };
    }

    const data = await response.json();
    return { success: true, reminder: data.reminder };
  } catch (error) {
    console.error('Error creating reminder:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function updateSmartReminder(
  id: string,
  payload: SmartReminderPayload
): Promise<{ success: boolean; reminder?: SmartReminder; error?: string }> {
  const token = await getAuthToken();

  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch(`${API_URL}/api/admin/smart-reminders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.error || error.message || 'Failed to update reminder',
      };
    }

    const data = await response.json();
    return { success: true, reminder: data.reminder };
  } catch (error) {
    console.error('Error updating reminder:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function toggleSmartReminder(
  id: string
): Promise<{ success: boolean; reminder?: SmartReminder; error?: string }> {
  const token = await getAuthToken();

  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch(
      `${API_URL}/api/admin/smart-reminders/${id}/toggle`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.error || error.message || 'Failed to toggle reminder',
      };
    }

    const data = await response.json();
    return { success: true, reminder: data.reminder };
  } catch (error) {
    console.error('Error toggling reminder:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function deleteSmartReminder(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();

  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch(`${API_URL}/api/admin/smart-reminders/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.error || error.message || 'Failed to delete reminder',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function triggerSmartReminder(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();

  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch(
      `${API_URL}/api/admin/smart-reminders/${id}/trigger`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.error || error.message || 'Failed to trigger reminder',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error triggering reminder:', error);
    return { success: false, error: 'Network error' };
  }
}
