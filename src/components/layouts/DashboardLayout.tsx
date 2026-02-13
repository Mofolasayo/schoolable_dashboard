'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  HelpCircle,
  Menu,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  dashboardNavigation,
  dashboardNavigationSections,
} from '@/config/navigation';
import { getUserAvatarUrl } from '@/lib/avatar';
import { cn } from '@/lib/utils';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/lib/api/backend';
// useEffect not needed - user passed from server
import { WebSocketWrapper } from '@/lib/websocket-wrapper';
import { logout } from '@/app/login/actions';

type DashboardLayoutProps = {
  children: React.ReactNode;
  user?: {
    id: string;
    employeeId?: string | null;
    email?: string | null;
    fullName?: string | null;
    role?: string | null;
    gender?: string | null;
    avatarUrl?: string | null;
  } | null;
};

/**
 * Reusable dashboard shell that wires up sidebar and header navigation.
 * Downstream pages render inside the main content area.
 */
export function DashboardLayout({
  children,
  user: initialUser,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(
    null
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  // Use passed user if available, default to null. Detailed fetching moved to server layout.
  const user = initialUser;
  // If user is provided, we aren't loading. If not provided and we expect it, handle accordingly.
  // Since it's passed from server, we can treat loading as false immediately.
  const [_isLoading, _setIsLoading] = useState(false);

  const userAvatar = getUserAvatarUrl({
    avatar_url: user?.avatarUrl ?? null,
    employee_id: user?.employeeId ?? null,
    email: user?.email ?? null,
    full_name: user?.fullName ?? null,
    gender: user?.gender ?? null,
    role: user?.role ?? null,
  });

  const formatNotificationTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString();
  };

  const loadNotifications = async (silent = false) => {
    if (!silent) {
      setNotificationLoading(true);
    }
    setNotificationError(null);
    try {
      const result = await getNotifications();
      setNotifications(result.notifications ?? []);
      setUnreadCount(result.unreadCount ?? 0);
    } catch {
      setNotificationError('Unable to load notifications.');
    } finally {
      if (!silent) {
        setNotificationLoading(false);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true }))
      );
      setUnreadCount(0);
    } catch {
      setNotificationError('Unable to mark all as read.');
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (item.isRead) return;
    try {
      await markNotificationRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch {
      setNotificationError('Unable to mark notification as read.');
    }
  };

  useEffect(() => {
    loadNotifications(true);
  }, []);

  useEffect(() => {
    if (!notificationOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationOpen]);

  useEffect(() => {
    if (notificationOpen) {
      loadNotifications(true);
    }
  }, [notificationOpen]);

  const toggleMobileNav = () => setMobileNavOpen((open) => !open);

  const isRouteActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard' || pathname === '/dashboard/'
      : pathname === href || pathname?.startsWith(`${href}/`);

  const navigationSections = dashboardNavigationSections
    .map((section) => ({
      ...section,
      items: dashboardNavigation.filter((item) => item.section === section.key),
    }))
    .filter((section) => section.items.length > 0);

  const activeSectionKey =
    navigationSections.find((section) =>
      section.items.some((item) => isRouteActive(item.href))
    )?.key ?? null;

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      navigationSections.forEach((section) => {
        const hasActive = section.items.some((item) =>
          isRouteActive(item.href)
        );
        initial[section.key] = hasActive || section.key === 'overview';
      });
      return initial;
    }
  );

  useEffect(() => {
    if (!activeSectionKey) return;
    setOpenSections((prev) =>
      prev[activeSectionKey] ? prev : { ...prev, [activeSectionKey]: true }
    );
  }, [activeSectionKey]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderNavLink = (
    item: (typeof dashboardNavigation)[number],
    opts?: { onNavigate?: () => void; className?: string }
  ) => {
    const { href, title, icon: Icon } = item;
    const isActive = isRouteActive(href);

    return (
      <Link
        key={href}
        href={href}
        onClick={() => {
          setMobileNavOpen(false);
          opts?.onNavigate?.();
        }}
        aria-label={title}
        aria-current={isActive ? 'page' : undefined}
        title={title}
        className={cn(
          'relative flex items-center gap-2.5 rounded-md border border-transparent px-3 py-2 text-sm font-medium transition-colors',
          opts?.className,
          isCollapsed && 'h-10 w-10 justify-center px-0',
          isActive
            ? 'bg-primary text-white shadow-sm'
            : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
        )}
      >
        {Icon ? (
          <Icon className="h-4 w-4 text-current" aria-hidden="true" />
        ) : null}
        {!isCollapsed ? <span>{title}</span> : null}
      </Link>
    );
  };

  return (
    <WebSocketWrapper>
      <div className="flex min-h-screen bg-[#F8FAFC]">
        {/* Sidebar - Fixed Width 220px */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200/60 bg-[#F7F7F8] transition-[width] duration-200 lg:flex',
            isCollapsed ? 'w-[80px]' : 'w-[240px]'
          )}
        >
          <div
            className={cn(
              'flex h-[64px] items-center justify-between border-b border-slate-200/60',
              isCollapsed ? 'px-4' : 'px-6'
            )}
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              <img
                src="/worksight_logo.png"
                alt="WorkSight"
                className={cn(
                  'h-8 w-auto object-contain',
                  isCollapsed && 'h-7'
                )}
              />
              {!isCollapsed ? (
                <span className="text-base font-semibold tracking-tight text-slate-900">
                  WorkSight
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="hidden h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-white/70 hover:text-slate-900 lg:inline-flex"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-5">
            {navigationSections.map((section) => {
              const isOpen = isCollapsed
                ? true
                : (openSections[section.key] ?? false);
              return (
                <div
                  key={section.key}
                  className={cn('px-3', isCollapsed ? 'mb-2' : 'mb-4')}
                >
                  {!isCollapsed ? (
                    <button
                      type="button"
                      onClick={() => toggleSection(section.key)}
                      aria-expanded={isOpen}
                      aria-controls={`nav-section-${section.key}`}
                      className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 hover:text-slate-500"
                    >
                      <span>{section.label}</span>
                      <ChevronDown
                        className={cn(
                          'h-3 w-3 text-slate-400 transition-transform',
                          isOpen ? 'rotate-180' : 'rotate-0'
                        )}
                      />
                    </button>
                  ) : null}
                  {isOpen ? (
                    <nav
                      id={`nav-section-${section.key}`}
                      className={cn(
                        'mt-2 flex flex-col gap-1',
                        isCollapsed && 'items-center gap-2'
                      )}
                    >
                      {section.items.map((item) =>
                        renderNavLink(item, {
                          className: isCollapsed ? 'px-0' : undefined,
                        })
                      )}
                    </nav>
                  ) : null}
                  {isCollapsed &&
                  section.key !==
                    navigationSections[navigationSections.length - 1]?.key ? (
                    <div className="my-2 flex justify-center">
                      <div className="h-px w-6 bg-slate-200/80" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Version Display */}
          <div className="border-t border-slate-200/60 px-6 py-4">
            <p className="text-[11px] font-medium text-slate-400">v1.0</p>
          </div>
        </aside>

        {/* Main Content Wrapper */}
        <div
          className={cn(
            'flex flex-1 flex-col',
            isCollapsed ? 'lg:pl-[80px]' : 'lg:pl-[240px]'
          )}
        >
          {/* Top Header - Sticky, Height 64px, z-30 */}
          <header className="sticky top-0 z-30 flex h-[64px] items-center gap-4 border-b border-border/40 bg-white/80 px-6 backdrop-blur">
            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={toggleMobileNav}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50 lg:hidden"
              aria-label="Toggle navigation"
              aria-expanded={mobileNavOpen}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Mobile Logo */}
            <div className="lg:hidden">
              <Link href="/dashboard" className="flex items-center">
                <img
                  src="/worksight_logo.png"
                  alt="WorkSight"
                  className="h-8 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Search */}
            <div className="flex flex-1 items-center px-4">
              {/* <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search staff, tasks, KPIs..."
                className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div> */}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={() => setNotificationOpen((open) => !open)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 ? (
                    <span className="absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : null}
                </button>

                {notificationOpen ? (
                  <div className="absolute right-0 top-full mt-2 w-[360px] overflow-hidden rounded-xl border border-border/60 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Notifications
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {unreadCount} unread
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs font-medium text-primary hover:text-primary/80"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-[360px] overflow-y-auto">
                      {notificationLoading ? (
                        <div className="px-4 py-6 text-sm text-muted-foreground">
                          Loading notifications...
                        </div>
                      ) : null}
                      {!notificationLoading && notificationError ? (
                        <div className="px-4 py-6 text-sm text-red-500">
                          {notificationError}
                        </div>
                      ) : null}
                      {!notificationLoading &&
                      !notificationError &&
                      notifications.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-muted-foreground">
                          No notifications yet.
                        </div>
                      ) : null}
                      {!notificationLoading && !notificationError
                        ? notifications.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleNotificationClick(item)}
                              className={cn(
                                'flex w-full flex-col gap-1 border-b border-border/30 px-4 py-3 text-left transition-colors',
                                item.isRead
                                  ? 'bg-white'
                                  : 'bg-slate-50/70 hover:bg-slate-50'
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-800">
                                  {item.title}
                                </p>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatNotificationTime(item.sentAt)}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600">
                                {item.body}
                              </p>
                              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                {item.type}
                              </span>
                            </button>
                          ))
                        : null}
                    </div>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                aria-label="Help"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
              {_isLoading ? (
                <div className="ml-2 flex items-center gap-3 rounded-md border border-border/40 bg-white py-1.5 pl-2 pr-3">
                  <div className="h-7 w-7 animate-pulse rounded-full bg-slate-200" />
                  <div className="hidden flex-col items-start gap-1 md:flex">
                    <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                    <div className="h-2 w-16 animate-pulse rounded bg-slate-200" />
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  <button className="ml-2 flex items-center gap-3 rounded-md border border-border/40 bg-white py-1.5 pl-2 pr-3 hover:bg-muted/50">
                    <img
                      src={userAvatar}
                      alt={user?.fullName || 'User'}
                      className="h-7 w-7 rounded-full object-cover ring-2 ring-gray-50"
                    />
                    <div className="hidden flex-col items-start text-left md:flex">
                      <span className="text-sm font-medium text-gray-700">
                        {user?.fullName || user?.email || 'Admin'}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {user?.role === 'admin'
                          ? 'Super Admin'
                          : user?.role || 'Admin'}
                      </span>
                    </div>
                    <ChevronDown className="hidden h-3 w-3 text-muted-foreground transition-transform group-hover:rotate-180 md:inline" />
                  </button>

                  {/* Dropdown Menu */}
                  <div className="invisible absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-border/40 bg-white p-2 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
                    <Link
                      href="/dashboard/settings?tab=personal_info"
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-gray-700 hover:bg-slate-50"
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <img
                        src={userAvatar}
                        className="h-4 w-4 rounded-full"
                        alt=""
                      />
                      Profile Settings
                    </Link>
                    <div className="my-1 h-px bg-slate-100" />
                    <form action={logout}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Mobile Navigation Overlay */}
          <nav
            className={cn(
              'fixed inset-0 z-40 grid place-content-start gap-2 bg-[#F7F7F8] p-6 lg:hidden',
              mobileNavOpen ? 'block' : 'hidden'
            )}
          >
            <div className="mb-6 flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2">
                <img
                  src="/worksight_logo.png"
                  alt="WorkSight"
                  className="h-8 w-auto object-contain"
                />
                <span className="text-lg font-semibold tracking-tight text-gray-800">
                  WorkSight
                </span>
              </Link>
              <button onClick={() => setMobileNavOpen(false)}>
                <Menu className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              {navigationSections.map((section) => {
                const isOpen = openSections[section.key] ?? false;
                return (
                  <div key={section.key}>
                    <button
                      type="button"
                      onClick={() => toggleSection(section.key)}
                      aria-expanded={isOpen}
                      aria-controls={`mobile-nav-section-${section.key}`}
                      className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400"
                    >
                      <span>{section.label}</span>
                      <ChevronDown
                        className={cn(
                          'h-3 w-3 text-slate-400 transition-transform',
                          isOpen ? 'rotate-180' : 'rotate-0'
                        )}
                      />
                    </button>
                    {isOpen ? (
                      <nav
                        id={`mobile-nav-section-${section.key}`}
                        className="mt-2 flex flex-col gap-1"
                      >
                        {section.items.map((item) => renderNavLink(item))}
                      </nav>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
        </div>
      </div>
    </WebSocketWrapper>
  );
}
