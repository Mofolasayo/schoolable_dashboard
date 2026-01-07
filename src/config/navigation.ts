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
  Briefcase,
  UsersRound,
  Sparkles,
  FolderOpen,
  History,
  Timer,
  Bell,
  Star,
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
    title: 'Late Analytics',
    href: '/dashboard/late-analytics',
    icon: Timer,
    description: 'Track late patterns and repeat offenders',
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
    title: 'Teams',
    href: '/dashboard/teams',
    icon: UsersRound,
    description: 'View all teams, KPIs, and performance scores',
    section: 'main',
  },
  {
    title: 'AI Insights',
    href: '/dashboard/ai-insights',
    icon: Sparkles,
    description: 'AI-generated performance insights across teams',
    section: 'main',
  },
  {
    title: 'Smart Reminders',
    href: '/dashboard/smart-reminders',
    icon: Bell,
    description: 'Automated notifications for pending actions',
    section: 'main',
  },
  {
    title: 'Team Lead Ratings',
    href: '/dashboard/team-lead-ratings',
    icon: Star,
    description: 'Rate team leads and view Aura trend alerts',
    section: 'main',
  },
  {
    title: 'HR & Policy',
    href: '/dashboard/hr-policy',
    icon: Briefcase,
    description: 'Manage probation, confirmation, structure, and promotions',
    section: 'system',
  },
  {
    title: 'Documents',
    href: '/dashboard/documents',
    icon: FolderOpen,
    description: 'Access organizational documents and policies',
    section: 'system',
  },
  {
    title: 'Audit Logs',
    href: '/dashboard/audit-logs',
    icon: History,
    description: 'Track system activities and changes',
    section: 'system',
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Configure platform preferences and KPI formulas',
    section: 'system',
  },
] as const satisfies readonly NavigationItem[];
