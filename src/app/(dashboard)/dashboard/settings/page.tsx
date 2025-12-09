import type { Metadata } from 'next';
import { config } from '@/config';

export const metadata: Metadata = {
  title: `${config.app.name} · Settings`,
};

import { logout } from '@/app/login/actions';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure platform preferences and KPI formulas.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-background p-12 text-center">
        <p className="text-muted-foreground">Settings page coming soon...</p>
      </div>

      <div className="mt-8 border-t border-border pt-8">
        <h2 className="mb-4 text-lg font-medium text-destructive">
          Danger Zone
        </h2>
        <form action={logout}>
          <Button variant="destructive" className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
}
