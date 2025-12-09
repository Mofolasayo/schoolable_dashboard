import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Clock,
  MessageSquare,
  Shield,
  FileText,
  Settings,
} from 'lucide-react';

/**
 * Shared navigation item shape for dashboard menus.
 */
export type NavigationItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  description?: string;
  section?: 'main' | 'system';
};

/**
 * Primary navigation links for the admin dashboard shell.
 * Update this list to control the sidebar and header menus.
 */
export const dashboardNavigation = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'High-level snapshot of performance across your organization',
    section: 'main',
  },
  {
    title: 'Staff Directory',
    href: '/dashboard/users',
    icon: Users,
    description: 'Master list of all employees and their details',
    section: 'main',
  },
  {
    title: 'Staff Performance',
    href: '/dashboard/staff',
    icon: Users,
    description: 'View and manage staff KPIs and performance',
    section: 'main',
  },
  {
    title: 'Task Management',
    href: '/dashboard/tasks',
    icon: CheckSquare,
    description: 'Track and assign tasks across the organization',
    section: 'main',
  },
  {
    title: 'Staff Attendance',
    href: '/dashboard/attendance',
    icon: Clock,
    description: 'Monitor staff attendance and punctuality',
    section: 'main',
  },
  {
    title: 'Announcements',
    href: '/dashboard/announcements',
    icon: MessageSquare,
    description: 'Team-wide announcements and updates',
    section: 'main',
  },
  {
    title: 'Compliance',
    href: '/dashboard/compliance',
    icon: Shield,
    description: 'Track policy adherence and compliance metrics',
    section: 'main',
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
    description: 'Generate and view performance reports',
    section: 'main',
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Configure platform preferences and KPI formulas',
    section: 'system',
  },
] as const satisfies readonly NavigationItem[];
