'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

async function getAuthToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get('admin-auth-token')?.value || null;
}

// Types
export interface CompliancePolicy {
    id: string;
    title: string;
    category: string;
    department: string | null;
    description: string;
    type: string;
    status: string;
    complianceRate: number;
    staffCount: number;
    nonCompliant: number;
    lastReview: string | null;
    nextReview: string | null;
}

export interface ComplianceMetrics {
    overallComplianceRate: number;
    totalPolicies: number;
    compliantPolicies: number;
    atRiskPolicies: number;
    nonCompliantPolicies: number;
}

export interface ComplianceSubmission {
    id: string;
    status: string;
    submittedAt: string | null;
    fileUrl: string | null;
    fileName: string | null;
    acknowledged: boolean | null;
    reviewNotes: string | null;
    userName?: string;
    userEmail?: string;
    userDepartment?: string;
}

export interface CreatePolicyRequest {
    title: string;
    category: string;
    department?: string;
    description: string;
    type: string;
    deadline?: string;
    reviewFrequencyDays?: number;
}

/**
 * Get all compliance policies
 */
export async function getCompliancePolicies(): Promise<CompliancePolicy[]> {
    const token = await getAuthToken();

    if (!token) {
        console.warn('No auth token available');
        return [];
    }

    try {
        const response = await fetch(`${API_URL}/compliance/policies`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('Error fetching compliance policies:', response.status);
            return [];
        }

        return response.json();
    } catch (error) {
        console.error('Error fetching compliance policies:', error);
        return [];
    }
}

/**
 * Get compliance metrics
 */
export async function getComplianceMetrics(): Promise<ComplianceMetrics | null> {
    const token = await getAuthToken();

    if (!token) {
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/compliance/metrics`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            return null;
        }

        return response.json();
    } catch (error) {
        console.error('Error fetching compliance metrics:', error);
        return null;
    }
}

/**
 * Create a new compliance policy
 */
export async function createCompliancePolicy(policy: CreatePolicyRequest): Promise<{ success: boolean; data?: CompliancePolicy; error?: string }> {
    const token = await getAuthToken();

    if (!token) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        const response = await fetch(`${API_URL}/compliance/policies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(policy),
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error || 'Failed to create policy' };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Error creating compliance policy:', error);
        return { success: false, error: 'Network error' };
    }
}

/**
 * Update a compliance policy
 */
export async function updateCompliancePolicy(id: string, policy: Partial<CreatePolicyRequest>): Promise<{ success: boolean; error?: string }> {
    const token = await getAuthToken();

    if (!token) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        const response = await fetch(`${API_URL}/compliance/policies/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(policy),
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error || 'Failed to update policy' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating compliance policy:', error);
        return { success: false, error: 'Network error' };
    }
}

/**
 * Delete a compliance policy
 */
export async function deleteCompliancePolicy(id: string): Promise<{ success: boolean; error?: string }> {
    const token = await getAuthToken();

    if (!token) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        const response = await fetch(`${API_URL}/compliance/policies/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            return { success: false, error: 'Failed to delete policy' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting compliance policy:', error);
        return { success: false, error: 'Network error' };
    }
}

/**
 * Get submissions for a policy
 */
export async function getComplianceSubmissions(policyId: string): Promise<ComplianceSubmission[]> {
    const token = await getAuthToken();

    if (!token) {
        return [];
    }

    try {
        const response = await fetch(`${API_URL}/compliance/policies/${policyId}/submissions`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            return [];
        }

        return response.json();
    } catch (error) {
        console.error('Error fetching submissions:', error);
        return [];
    }
}

/**
 * Review a submission
 */
export async function reviewComplianceSubmission(
    submissionId: string,
    status: 'approved' | 'rejected',
    notes?: string
): Promise<{ success: boolean; error?: string }> {
    const token = await getAuthToken();

    if (!token) {
        return { success: false, error: 'Not authenticated' };
    }

    try {
        const response = await fetch(`${API_URL}/compliance/submissions/${submissionId}/review`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ status, notes }),
        });

        if (!response.ok) {
            return { success: false, error: 'Failed to review submission' };
        }

        return { success: true };
    } catch (error) {
        console.error('Error reviewing submission:', error);
        return { success: false, error: 'Network error' };
    }
}
