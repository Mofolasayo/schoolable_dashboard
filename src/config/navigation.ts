import type { LucideIcon } from 'lucide-react';
import { ChartSpline, LayoutDashboard, Settings, Users } from 'lucide-react';

/**
 * Shared navigation item shape for dashboard menus.
 */
export type NavigationItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  description?: string;
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
    description: 'Key metrics and latest activity',
  },
  {
    title: 'Users',
    href: '/dashboard/users',
    icon: Users,
    description: 'Manage user accounts and roles',
  },
  {
    title: 'Insights',
    href: '/dashboard/insights',
    icon: ChartSpline,
    description: 'Charts and analytics for product performance',
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Configure platform preferences',
  },
] as const satisfies readonly NavigationItem[];
