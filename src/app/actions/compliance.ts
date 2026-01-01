'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://schoolable-backend.onrender.com';

async function getAuthToken() {
    const cookieStore = await cookies();
    return cookieStore.get('auth-token')?.value || null;
}

export async function getComplianceItems() {
    const token = await getAuthToken();
    if (!token) return [];

    // Mocking response for now until backend endpoint is ready
    return [
        {
            id: '1',
            title: 'New Workplace Policy',
            description: 'Please review and acknowledge the updated workplace anti-harassment policy.',
            deadline: '2025-12-31',
            type: 'policy',
            status: 'pending'
        },
        {
            id: '2',
            title: 'Submit ID Document',
            description: 'Upload a clear copy of your government-issued ID.',
            deadline: '2026-01-15',
            type: 'upload',
            status: 'pending'
        }
    ];
}
