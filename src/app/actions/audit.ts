'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export interface AuditLog {
    id: number;
    entityType: string;
    entityId: string;
    action: string;
    actorId: string | null;
    actorName: string | null;
    actorEmail: string | null;
    changes: Record<string, unknown> | null;
    metadata: Record<string, unknown> | null;
    ipAddress: string | null;
    createdAt: string;
}

export interface AuditLogsResponse {
    logs: AuditLog[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

export async function getAuditLogs(page: number = 0, size: number = 20, entityType?: string): Promise<AuditLogsResponse> {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-auth-token')?.value;

    if (!token) {
        throw new Error('Not authenticated');
    }

    let url = `${API_URL}/api/audit/logs?page=${page}&size=${size}`;
    if (entityType && entityType !== 'All') {
        url += `&entityType=${entityType}`;
    }

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
    }
}
