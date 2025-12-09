'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

// Admin credentials - only this account can access the dashboard
const ADMIN_EMAIL = 'schoolablesuberadmin@gmail.com';
const ADMIN_PASSWORD = 'schoolablesuperadmin1234';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validate admin credentials
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    redirect('/login?error=Invalid admin credentials. Access denied.');
  }

  // Sign in with Supabase (admin account should already exist in Supabase)
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect('/login?error=Authentication failed. Please contact support.');
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
