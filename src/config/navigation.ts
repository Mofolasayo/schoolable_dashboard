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
  Star,
} from 'lucide-react';

/**
 * Shared navigation item shape for dashboard menus.
 */
export type NavigationSectionKey =
  | 'overview'
  | 'people'
  | 'operations'
  | 'insights'
  | 'communication'
  | 'governance'
  | 'system';

export type NavigationItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  description?: string;
  section: NavigationSectionKey;
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
    section: 'overview',
  },
  {
    title: 'Staff Directory',
    href: '/dashboard/users',
    icon: Users,
    description: 'Master list of all employees and their details',
    section: 'people',
  },
  {
    title: 'Teams',
    href: '/dashboard/teams',
    icon: UsersRound,
    description: 'View all teams, KPIs, and performance scores',
    section: 'people',
  },
  {
    title: 'Staff Performance',
    href: '/dashboard/staff',
    icon: Users,
    description: 'View and manage staff KPIs and performance',
    section: 'people',
  },
  {
    title: 'Team Lead Ratings',
    href: '/dashboard/team-lead-ratings',
    icon: Star,
    description: 'Rate team leads and view Aura trend alerts',
    section: 'people',
  },
  {
    title: 'Task Management',
    href: '/dashboard/tasks',
    icon: CheckSquare,
    description: 'Track and assign tasks across the organization',
    section: 'operations',
  },
  {
    title: 'Staff Attendance',
    href: '/dashboard/attendance',
    icon: Clock,
    description: 'Monitor staff attendance and punctuality',
    section: 'operations',
  },
  {
    title: 'Late Analytics',
    href: '/dashboard/late-analytics',
    icon: Timer,
    description: 'Track late patterns and repeat offenders',
    section: 'operations',
  },
  {
    title: 'Announcements',
    href: '/dashboard/announcements',
    icon: MessageSquare,
    description: 'Team-wide announcements and updates',
    section: 'communication',
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
    description: 'Generate and view performance reports',
    section: 'insights',
  },
  {
    title: 'AI Insights',
    href: '/dashboard/ai-insights',
    icon: Sparkles,
    description: 'AI-generated performance insights across teams',
    section: 'insights',
  },
  {
    title: 'Compliance',
    href: '/dashboard/compliance',
    icon: Shield,
    description: 'Track policy adherence and compliance metrics',
    section: 'governance',
  },
  {
    title: 'HR & Policy',
    href: '/dashboard/hr-policy',
    icon: Briefcase,
    description: 'Manage probation, confirmation, structure, and promotions',
    section: 'governance',
  },
  {
    title: 'Documents',
    href: '/dashboard/documents',
    icon: FolderOpen,
    description: 'Access organizational documents and policies',
    section: 'governance',
  },
  {
    title: 'Audit Logs',
    href: '/dashboard/audit-logs',
    icon: History,
    description: 'Track system activities and changes',
    section: 'governance',
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Configure platform preferences and KPI formulas',
    section: 'system',
  },
] as const satisfies readonly NavigationItem[];

export const dashboardNavigationSections = [
  { key: 'overview', label: 'Overview' },
  { key: 'people', label: 'People' },
  { key: 'operations', label: 'Operations' },
  { key: 'insights', label: 'Insights' },
  { key: 'governance', label: 'Governance' },
  { key: 'communication', label: 'Communication' },
  { key: 'system', label: 'System' },
] as const satisfies readonly { key: NavigationSectionKey; label: string }[];
