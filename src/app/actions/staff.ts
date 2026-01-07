'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

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

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('admin-auth-token')?.value || null;
}

export async function getStaffProfiles(): Promise<StaffProfile[]> {
  const token = await getAuthToken();

  if (!token) {
    console.warn('No auth token available for staff fetch');
    return [];
  }

  try {
    const response = await fetch(`${API_URL}/profile/staff`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Error fetching staff profiles:', response.status);
      return [];
    }

    const data: StaffProfile[] = await response.json();

    // Ensure avatar_url is set (backend should already provide this)
    return data.map((profile) => ({
      ...profile,
      avatar_url: profile.avatar_url || generateAvatarUrl(profile),
    }));
  } catch (error) {
    console.error('Error fetching staff profiles:', error);
    return [];
  }
}

export async function getAllProfiles(): Promise<StaffProfile[]> {
  const token = await getAuthToken();

  if (!token) {
    console.warn('No auth token available for profile fetch');
    return [];
  }

  try {
    const response = await fetch(`${API_URL}/profile/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Error fetching all profiles:', response.status);
      return [];
    }

    const data: StaffProfile[] = await response.json();
    return data.map((profile) => ({
      ...profile,
      avatar_url: profile.avatar_url || generateAvatarUrl(profile),
    }));
  } catch (error) {
    console.error('Error fetching all profiles:', error);
    return [];
  }
}

function generateAvatarUrl(profile: StaffProfile): string {
  const gender = profile.gender?.toLowerCase();
  let style = 'bottts';
  if (gender === 'male') style = 'adventurer';
  else if (gender === 'female') style = 'adventurer-neutral';

  const seed = profile.employee_id || profile.email || profile.full_name || 'User';
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}
