import type { Metadata } from 'next';
import { BarChart3, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Insights · Dashboard',
};

const insightCards = [
  {
    title: 'Conversion Rate',
    value: '4.83%',
    change: '+0.4%',
    trend: 'Higher than last week',
  },
  {
    title: 'Average Time to Resolve',
    value: '2h 14m',
    change: '-12%',
    trend: 'Operational efficiency improving',
  },
  {
    title: 'Chargeback Ratio',
    value: '0.57%',
    change: '-0.1%',
    trend: 'Within accepted threshold',
  },
];

export default function DashboardInsightsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="text-sm text-muted-foreground">
          Data visualisations for growth, retention, and operational efficiency.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {insightCards.map((card) => (
          <article
            key={card.title}
            className="rounded-lg border border-border bg-background/80 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {card.title}
              </span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {card.value}
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-600">
              {card.change}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{card.trend}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-border bg-background/80 p-6 shadow-sm">
        <header className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Volume by channel</h2>
            <p className="text-sm text-muted-foreground">
              Compare web, mobile, and partner transactions over the last 30
              days.
            </p>
          </div>
        </header>
        <div className="mt-6 space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between rounded-md border border-dashed border-border/80 bg-muted/40 px-4 py-3">
            <span className="font-medium text-foreground">Web</span>
            <span>52%</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-dashed border-border/80 bg-muted/40 px-4 py-3">
            <span className="font-medium text-foreground">Mobile</span>
            <span>31%</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-dashed border-border/80 bg-muted/40 px-4 py-3">
            <span className="font-medium text-foreground">Partner API</span>
            <span>17%</span>
          </div>
        </div>
      </section>
    </div>
  );
}
