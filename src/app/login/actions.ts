'use server';

import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

// Cookie names specific to Super Admin Dashboard
const AUTH_TOKEN_COOKIE = 'admin-auth-token';
const USER_INFO_COOKIE = 'admin-user-info';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || errorData.message || 'Invalid email or password'
      );
    }

    const data = await response.json();
    const profile = data.profile || {};

    // Store the JWT token in an HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set(AUTH_TOKEN_COOKIE, data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Store user info in a separate cookie (not sensitive)
    cookieStore.set(
      USER_INFO_COOKIE,
      JSON.stringify({
        id: profile.id,
        employeeId: profile.employee_id || profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: profile.role,
        gender: profile.gender || null,
        avatarUrl: profile.avatar_url || null,
      }),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Login failed. Please try again.');
  }

  return { ok: true };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_TOKEN_COOKIE);
  cookieStore.delete(USER_INFO_COOKIE);
  // Also cleanup any legacy cookies
  cookieStore.delete('auth-token');
  cookieStore.delete('user-info');
  redirect('/login');
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE);
  return token?.value || null;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userInfo = cookieStore.get(USER_INFO_COOKIE);

  if (!userInfo?.value) {
    return null;
  }

  try {
    return JSON.parse(userInfo.value);
  } catch {
    return null;
  }
}
