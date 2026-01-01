'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

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
            throw new Error(errorData.message || 'Invalid email or password');
        }

        const data = await response.json();

        // Store the JWT token in an HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set('auth-token', data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24, // 24 hours
        });

        // Store user info in a separate cookie (not sensitive)
        cookieStore.set('user-info', JSON.stringify({
            id: data.id,
            email: data.email,
            fullName: data.fullName,
            role: data.role,
        }), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24,
        });

    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Login failed. Please try again.');
    }

    // Redirect to dashboard after successful login
    redirect('/dashboard');
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
    cookieStore.delete('auth_token'); // Cleanup legacy/mismatched cookie
    cookieStore.delete('user-info');
    redirect('/login');
}

export async function getAuthToken(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    return token?.value || null;
}

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const userInfo = cookieStore.get('user-info');

    if (!userInfo?.value) {
        return null;
    }

    try {
        return JSON.parse(userInfo.value);
    } catch {
        return null;
    }
}
