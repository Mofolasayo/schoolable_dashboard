import type { Metadata } from 'next';
import { ArrowUpRight, Bell, Users } from 'lucide-react';
import { config } from '@/config';

export const metadata: Metadata = {
  title: `${config.app.name} · Overview`,
};

const metrics = [
  {
    label: 'Active Users',
    value: '2,431',
    delta: '+8.2%',
    icon: Users,
  },
  {
    label: 'Monthly Revenue',
    value: '$84,120',
    delta: '+3.4%',
    icon: ArrowUpRight,
  },
  {
    label: 'Support Tickets',
    value: '18 open',
    delta: '-12%',
    icon: Bell,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Monitor product health, track team performance, and stay ahead of key
          metrics.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article
              key={metric.label}
              className="rounded-lg border border-border bg-background/80 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight">
                {metric.value}
              </p>
              <p className="mt-1 text-xs font-medium text-emerald-600">
                {metric.delta} vs. last month
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-lg border border-border bg-background/80 p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <p className="text-sm text-muted-foreground">
                High-signal events across the platform.
              </p>
            </div>
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              View all
            </button>
          </header>
          <dl className="mt-6 space-y-4">
            {[
              {
                title: 'New payout released',
                details: 'Wallet ID 0x7281 — $4,200.00',
                timestamp: '5 minutes ago',
              },
              {
                title: 'Dispute resolved',
                details: 'Case #24587 — Outcome: Refunded',
                timestamp: '42 minutes ago',
              },
              {
                title: 'Integration deployed',
                details: 'Allpro SDK v2.3.1 to Production',
                timestamp: '2 hours ago',
              },
            ].map((event) => (
              <div key={event.title} className="rounded-md bg-muted/60 p-4">
                <dt className="text-sm font-semibold">{event.title}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">
                  {event.details}
                </dd>
                <time className="mt-2 block text-xs text-muted-foreground/80">
                  {event.timestamp}
                </time>
              </div>
            ))}
          </dl>
        </article>

        <article className="rounded-lg border border-border bg-background/80 p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Roadmap</h2>
              <p className="text-sm text-muted-foreground">
                What the team is tackling next.
              </p>
            </div>
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Manage roadmap
            </button>
          </header>
          <ul className="mt-6 space-y-4">
            {[
              {
                phase: 'In review',
                task: 'KYC v2 risk rules',
                owner: 'Compliance team',
              },
              {
                phase: 'In progress',
                task: 'Advanced reconciliation exports',
                owner: 'Data engineering',
              },
              {
                phase: 'Planned',
                task: 'Adaptive rate limits for APIs',
                owner: 'Core platform',
              },
            ].map((item) => (
              <li
                key={item.task}
                className="rounded-md border border-dashed border-border/80 p-4"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {item.phase}
                </p>
                <p className="mt-1 text-sm font-semibold">{item.task}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Owner: {item.owner}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
