'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { config } from '@/config';
import { dashboardNavigation } from '@/config/navigation';
import { cn } from '@/lib/utils';

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

  const toggleMobileNav = () => setMobileNavOpen((open) => !open);

  const renderNavLink = (
    item: (typeof dashboardNavigation)[number],
    opts?: { onNavigate?: () => void; className?: string }
  ) => {
    const { href, title, icon: Icon } = item;
    const isActive = pathname === href || pathname?.startsWith(`${href}/`);

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
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          opts?.className,
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
        <span>{title}</span>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleMobileNav}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
              aria-label="Toggle navigation"
              aria-expanded={mobileNavOpen}
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
            <Link href="/" className="text-lg font-semibold leading-6">
              {config.app.name}
            </Link>
          </div>
        </div>
        <nav
          className={cn(
            'grid gap-2 border-t px-4 py-3 lg:hidden',
            mobileNavOpen ? 'grid' : 'hidden'
          )}
        >
          {dashboardNavigation.map((item) => renderNavLink(item))}
        </nav>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-background lg:block">
          <div className="flex h-16 items-center border-b px-6 text-base font-semibold">
            {config.app.name} Admin
          </div>
          <nav className="flex flex-col gap-1 px-4 py-6">
            {dashboardNavigation.map((item) =>
              renderNavLink(item, {
                className: 'gap-3',
              })
            )}
          </nav>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
