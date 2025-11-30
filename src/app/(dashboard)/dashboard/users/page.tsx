import type { Metadata } from 'next';
import { Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'User Management · Dashboard',
};

const teams = [
  {
    name: 'Platform Admins',
    members: 6,
    description: 'Full system access with audit logging enabled.',
  },
  {
    name: 'Risk & Compliance',
    members: 12,
    description: 'Transaction reviews, SAR escalations, and dispute workflows.',
  },
  {
    name: 'Customer Operations',
    members: 18,
    description: 'Account support, verifications, and manual payouts.',
  },
];

export default function DashboardUsersPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage admin roles, enforce access policies, and review invitations.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Invite teammate
        </button>
      </header>

      <section className="grid gap-4">
        {teams.map((team) => (
          <article
            key={team.name}
            className="rounded-lg border border-border bg-background/80 p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">{team.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {team.description}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-dashed border-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                {team.members} members
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3 rounded-lg border border-border bg-background/80 p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Pending Invitations
        </h2>
        <p className="text-sm text-muted-foreground">
          Send reminders to teammates who haven’t accepted their invite yet.
        </p>
        <div className="rounded-md border border-dashed border-border/80 bg-muted/40 p-4 text-sm text-muted-foreground">
          No pending invitations — invite someone new to get started.
        </div>
      </section>
    </div>
  );
}
