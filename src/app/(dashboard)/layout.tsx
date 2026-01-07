import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { config } from '@/config';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export const metadata: Metadata = {
  title: `${config.app.name} · Dashboard`,
  description: 'Administrative workspace and monitoring tools.',
};

type DashboardGroupLayoutProps = {
  children: ReactNode;
};

import { cookies } from 'next/headers';

export default async function DashboardGroupLayout({
  children,
}: DashboardGroupLayoutProps) {
  const cookieStore = await cookies();
  const userInfoCookie = cookieStore.get('admin-user-info');
  let user = null;

  if (userInfoCookie) {
    try {
      user = JSON.parse(decodeURIComponent(userInfoCookie.value));
    } catch (e) {
      console.error('Failed to parse user cookie', e);
    }
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
