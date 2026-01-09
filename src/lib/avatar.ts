/**
 * Avatar utility functions for consistent avatar generation across the dashboard
 */

// Super Admin has a consistent identity across all dashboards
// Using a fixed seed ensures the same avatar appears everywhere
export const SUPER_ADMIN_AVATAR_SEED = 'schoolable-super-admin-2026';

/**
 * Get avatar URL for Super Admin - consistent across all pages
 */
export function getSuperAdminAvatarUrl(): string {
    return `https://api.dicebear.com/7.x/personas/svg?seed=${SUPER_ADMIN_AVATAR_SEED}&backgroundColor=c0aede`;
}

/**
 * Get avatar URL for any user based on their profile data
 * Uses gender-appropriate DiceBear styles
 */
export function getUserAvatarUrl(profile: {
    avatar_url?: string | null;
    gender?: string | null;
    employee_id?: string | null;
    id?: string;
    email?: string | null;
    full_name?: string | null;
    role?: string | null;
}): string {
    // Use custom avatar if provided
    if (profile.avatar_url && profile.avatar_url.length > 0) {
        return profile.avatar_url;
    }

    // Check if this is a super admin
    const role = profile.role?.toLowerCase() || '';
    if (role === 'admin' || role === 'super_admin' || role === 'superadmin') {
        return getSuperAdminAvatarUrl();
    }

    // Generate seed from employee_id, id, email, or name (in priority order)
    const seed = profile.employee_id || profile.id || profile.email || profile.full_name || 'default-user';

    // Use gender-appropriate DiceBear styles
    const gender = profile.gender?.toLowerCase();

    if (gender === 'female') {
        // Softer, more feminine style
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&accessories=prescription01,prescription02&accessoriesProbability=30&clothingGraphic=diamond,pizza,rainbow&hairColor=auburn,black,blonde,brown&skinColor=ffd5dc,edb98a,d08b5b,ae5d29`;
    } else if (gender === 'male') {
        // More angular, masculine style  
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&facialHair=beardMedium,beardLight&facialHairProbability=30&hairColor=auburn,black,blonde,brown&skinColor=ffd5dc,edb98a,d08b5b,ae5d29`;
    }

    // Default: bottts style for unknown gender (robotic, gender-neutral)
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
}

/**
 * Get avatar URL for a Team Lead
 */
export function getTeamLeadAvatarUrl(lead: {
    avatar_url?: string | null;
    gender?: string | null;
    employeeId?: string | null;
    id?: string;
    email?: string | null;
    name?: string | null;
}): string {
    // Use custom avatar if provided
    if (lead.avatar_url && lead.avatar_url.length > 0) {
        return lead.avatar_url;
    }

    const seed = lead.employeeId || lead.id || lead.email || lead.name || 'default-lead';
    const gender = lead.gender?.toLowerCase();

    if (gender === 'female') {
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&accessories=prescription01,prescription02&accessoriesProbability=30`;
    } else if (gender === 'male') {
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&facialHair=beardMedium,beardLight&facialHairProbability=30`;
    }

    // Default style
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
}
