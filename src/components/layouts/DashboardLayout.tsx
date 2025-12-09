'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, HelpCircle, Menu, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { dashboardNavigation } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

/**
 * Reusable dashboard shell that wires up sidebar and header navigation.
 * Downstream pages render inside the main content area.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    email?: string | null;
  } | null>(null);
  const [profile, setProfile] = useState<{
    full_name?: string | null;
    avatar_url?: string | null;
    role?: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          setProfile(profile);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const toggleMobileNav = () => setMobileNavOpen((open) => !open);

  const mainNavItems = dashboardNavigation.filter(
    (item) => item.section === 'main'
  );
  const systemNavItems = dashboardNavigation.filter(
    (item) => item.section === 'system'
  );

  const renderNavLink = (
    item: (typeof dashboardNavigation)[number],
    opts?: { onNavigate?: () => void; className?: string }
  ) => {
    const { href, title, icon: Icon } = item;
    // Fix routing: Only match exact path or child paths, but not parent paths
    // For /dashboard, only match exactly /dashboard or /dashboard/ (not /dashboard/staff)
    // For /dashboard/staff, match /dashboard/staff or /dashboard/staff/*
    const isActive =
      href === '/dashboard'
        ? pathname === '/dashboard' || pathname === '/dashboard/'
        : pathname === href || pathname?.startsWith(`${href}/`);

    return (
      <Link
        key={href}
        href={href}
        onClick={() => {
          setMobileNavOpen(false);
          opts?.onNavigate?.();
        }}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
          opts?.className,
          isActive
            ? 'bg-primary text-white'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        )}
      >
        {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
        <span>{title}</span>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar - Fixed Width 220px */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col border-r border-border/40 bg-white lg:flex">
        <div className="flex h-[64px] items-center border-b border-border/40 px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img
              src="/schoolable_logo.png"
              alt="Schoolable"
              className="h-8 w-auto object-contain"
            />
            <span className="text-lg font-semibold tracking-tight text-gray-800">
              Schoolable
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <div className="mb-2 px-4">
            <nav className="flex flex-col gap-1">
              {mainNavItems.map((item) => renderNavLink(item))}
            </nav>
          </div>

          <div className="mt-6 px-4">
            <h3 className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              System
            </h3>
            <nav className="flex flex-col gap-1">
              {systemNavItems.map((item) => renderNavLink(item))}
            </nav>
          </div>
        </div>

        {/* Version Display */}
        <div className="border-t border-border/40 px-6 py-4">
          <p className="text-[11px] font-normal text-muted-foreground/70">
            v1.0
          </p>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex flex-1 flex-col lg:pl-[220px]">
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
                src="/schoolable_logo.png"
                alt="Schoolable"
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
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-white" />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              aria-label="Help"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            {isLoading ? (
              <div className="ml-2 flex items-center gap-3 rounded-md border border-border/40 bg-white py-1.5 pl-2 pr-3">
                <div className="h-7 w-7 animate-pulse rounded-full bg-slate-200" />
                <div className="hidden flex-col items-start gap-1 md:flex">
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="h-2 w-16 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="ml-2 flex items-center gap-3 rounded-md border border-border/40 bg-white py-1.5 pl-2 pr-3 hover:bg-muted/50"
              >
                <img
                  src={
                    profile?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name || user?.email || 'User'}`
                  }
                  alt={profile?.full_name || 'User'}
                  className="h-7 w-7 rounded-full object-cover ring-2 ring-gray-50"
                />
                <div className="hidden flex-col items-start text-left md:flex">
                  <span className="text-sm font-medium text-gray-700">
                    {profile?.full_name || user?.email || 'Loading...'}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {profile?.role || 'User'}
                  </span>
                </div>
                <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:inline" />
              </button>
            )}
          </div>
        </header>

        {/* Mobile Navigation Overlay */}
        <nav
          className={cn(
            'fixed inset-0 z-40 grid place-content-start gap-2 bg-white p-6 lg:hidden',
            mobileNavOpen ? 'block' : 'hidden'
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img
                src="/schoolable_logo.png"
                alt="Schoolable"
                className="h-8 w-auto object-contain"
              />
              <span className="text-lg font-semibold tracking-tight text-gray-800">
                Schoolable
              </span>
            </Link>
            <button onClick={() => setMobileNavOpen(false)}>
              <Menu className="h-6 w-6" />
            </button>
          </div>
          {dashboardNavigation.map((item) => renderNavLink(item))}
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
