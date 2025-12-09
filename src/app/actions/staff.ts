'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export interface StaffProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  department: string | null;
  employee_id: string | null;
  status: string | null;
  date_joined: string | null;
  gender: string | null;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  avatar_url?: string; // computed
}

export async function getStaffProfiles() {
  let supabase;

  // Try to use Service Role Key for Admin Access (Bypass RLS)
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (serviceRoleKey && supabaseUrl) {
    console.warn('⚡️ Using Service Role Key for Staff Fetch');
    supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } else {
    console.warn('⚠️ using standard user client (RLS applies)');
    supabase = await createServerClient();
    // Ensure we have a session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      console.warn('No active session found for staff fetch');
      return [];
    }
  }

  // Fetch all profiles from public.profiles
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('role', 'admin') // Exclude admins
    .neq('role', 'Admin') // Exclude capitalized Admin
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching staff profiles:', error);
    return [];
  }

  // Augment with DiceBear avatar if needed
  return (data || []).map((profile: StaffProfile) => ({
    ...profile,
    avatar_url:
      profile.avatar_url ||
      `https://api.dicebear.com/7.x/${
        profile.gender?.toLowerCase() === 'male'
          ? 'adventurer'
          : profile.gender?.toLowerCase() === 'female'
            ? 'adventurer-neutral'
            : 'bottts'
      }/svg?seed=${profile.employee_id || profile.email || profile.full_name}`,
  })) as StaffProfile[];
}
