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

export default function DashboardGroupLayout({
  children,
}: DashboardGroupLayoutProps) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
