'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('admin-auth-token')?.value || null;
}

export interface OrganizationSettings {
  id: number | null;
  name: string | null;
  email: string | null;
  license: string | null;
  address: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface UserPreferences {
  userId?: string | null;
  emailNotifications: boolean | null;
  pushNotifications: boolean | null;
  marketingNotifications: boolean | null;
  securityAlerts: boolean | null;
  theme: 'light' | 'dark' | 'system' | null;
  updatedAt?: string | null;
}

export interface StaffProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  job_title: string | null;
  department: string | null;
  employee_id: string | null;
  status: string | null;
  date_joined: string | null;
  gender: string | null;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
}

export async function getMyProfile(): Promise<StaffProfile | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/profile/me`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function updateMyProfile(
  data: Partial<StaffProfile>
): Promise<StaffProfile | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/profile/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        full_name: data.full_name,
        job_title: data.job_title,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
      }),
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
}

export async function uploadAvatar(
  formData: FormData
): Promise<{ avatar_url: string } | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/profile/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }
}

export async function getOrganizationSettings(): Promise<OrganizationSettings | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/api/settings/organization`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error fetching organization settings:', error);
    return null;
  }
}

export async function updateOrganizationSettings(
  data: Partial<OrganizationSettings>
): Promise<OrganizationSettings | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/api/settings/organization`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        license: data.license,
        address: data.address,
      }),
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error updating organization settings:', error);
    return null;
  }
}

export async function getUserPreferences(): Promise<UserPreferences | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/api/settings/preferences`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
}

export async function updateUserPreferences(
  data: Partial<UserPreferences>
): Promise<UserPreferences | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/api/settings/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        emailNotifications: data.emailNotifications,
        pushNotifications: data.pushNotifications,
        marketingNotifications: data.marketingNotifications,
        securityAlerts: data.securityAlerts,
        theme: data.theme,
      }),
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return null;
  }
}
