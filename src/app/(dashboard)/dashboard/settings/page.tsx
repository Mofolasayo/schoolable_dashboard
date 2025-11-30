import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings · Dashboard',
};

const settingsSections = [
  {
    title: 'Account',
    description:
      'Profile details, contact preferences, and authentication methods.',
  },
  {
    title: 'Security',
    description:
      'Session management, device approvals, and two factor enforcement.',
  },
  {
    title: 'Notifications',
    description:
      'Email, Slack, and webhook alerts for mission-critical events.',
  },
];

export default function DashboardSettingsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure policies, audit changes, and tailor the dashboard experience
          for your team.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        {settingsSections.map((section) => (
          <article
            key={section.title}
            className="rounded-lg border border-border bg-background/80 p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {section.description}
            </p>
            <button
              type="button"
              className="mt-4 inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Manage {section.title.toLowerCase()}
            </button>
          </article>
        ))}
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-background/80 p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Danger zone</h2>
          <p className="text-sm text-muted-foreground">
            Restrict access and enforce approvals before enabling destructive
            actions in production.
          </p>
        </div>
        <div className="rounded-md border border-dashed border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Access to destructive actions is currently limited to Platform Admin
            roles. Update permissions to allow other teams to pause payouts,
            rotate keys, or archive organisations.
          </p>
        </div>
      </section>
    </div>
  );
}
