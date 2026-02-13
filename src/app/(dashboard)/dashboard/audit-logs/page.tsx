'use client';

import { useState, useEffect, useCallback, type ComponentType } from 'react';
import {
  RefreshCw,
  Loader2,
  AlertCircle,
  Clock,
  FileText,
  FolderOpen,
  Star,
} from 'lucide-react';
import {
  getRecentActivity,
  type RecentActivityResponse,
  type RecentActivityItem,
} from '@/app/actions/audit';

type IconType = ComponentType<{ className?: string }>;

export default function AuditLogsPage() {
  const [activity, setActivity] = useState<RecentActivityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getRecentActivity();
      setActivity(data);
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setActivity(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const formatCompactDate = (value: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const reportItems = activity?.reports ?? [];
  const documentItems = activity?.documents ?? [];
  const ratingItems = activity?.ratings ?? [];
  const lastUpdatedLabel = formatCompactDate(lastUpdatedAt);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Recent Activity
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Latest reports, documents, and ratings captured across the
            organization.
          </p>
        </div>
        <button
          onClick={fetchActivity}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchActivity}
            className="ml-auto text-sm font-medium text-red-700 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Reports"
          value={reportItems.length.toLocaleString()}
          icon={FileText}
          iconClassName="text-indigo-600"
          iconWrapperClassName="bg-indigo-50"
        />
        <StatCard
          title="Documents"
          value={documentItems.length.toLocaleString()}
          icon={FolderOpen}
          iconClassName="text-emerald-600"
          iconWrapperClassName="bg-emerald-50"
        />
        <StatCard
          title="Ratings"
          value={ratingItems.length.toLocaleString()}
          icon={Star}
          iconClassName="text-amber-600"
          iconWrapperClassName="bg-amber-50"
        />
        <StatCard
          title="Latest activity"
          value={lastUpdatedLabel}
          icon={Clock}
          iconClassName="text-slate-600"
          iconWrapperClassName="bg-slate-100"
        />
      </div>

      {isLoading && !activity && (
        <div className="flex items-center justify-center rounded-xl border border-border/40 bg-white p-10 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading recent activity...
            </p>
          </div>
        </div>
      )}

      {!isLoading && activity && (
        <div className="grid gap-4 lg:grid-cols-3">
          <ActivityCard
            title="Weekly reports"
            description="Latest team report submissions"
            icon={FileText}
            iconClassName="text-indigo-600"
            iconWrapperClassName="bg-indigo-50"
            items={reportItems}
            emptyMessage="No weekly reports submitted yet."
            formatDate={formatCompactDate}
          />
          <ActivityCard
            title="Documents"
            description="Certificates and compliance uploads"
            icon={FolderOpen}
            iconClassName="text-emerald-600"
            iconWrapperClassName="bg-emerald-50"
            items={documentItems}
            emptyMessage="No documents uploaded recently."
            formatDate={formatCompactDate}
          />
          <ActivityCard
            title="Team lead ratings"
            description="Most recent leadership reviews"
            icon={Star}
            iconClassName="text-amber-600"
            iconWrapperClassName="bg-amber-50"
            items={ratingItems}
            emptyMessage="No ratings captured yet."
            formatDate={formatCompactDate}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  iconWrapperClassName,
}: {
  title: string;
  value: string | number;
  icon: IconType;
  iconClassName: string;
  iconWrapperClassName: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${iconWrapperClassName}`}>
          <Icon className={`h-4 w-4 ${iconClassName}`} />
        </div>
      </div>
    </div>
  );
}

function ActivityCard({
  title,
  description,
  icon: Icon,
  iconClassName,
  iconWrapperClassName,
  items,
  emptyMessage,
  formatDate,
}: {
  title: string;
  description: string;
  icon: IconType;
  iconClassName: string;
  iconWrapperClassName: string;
  items: RecentActivityItem[];
  emptyMessage: string;
  formatDate: (value: string | null) => string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
      <div className="border-b border-border/40 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${iconWrapperClassName}`}>
              <Icon className={`h-4 w-4 ${iconClassName}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {items.length}
          </span>
        </div>
      </div>
      <div className="divide-y divide-border/40">
        {items.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-slate-500">
            {emptyMessage}
          </div>
        )}
        {items.map((item) => (
          <div key={item.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-normal text-slate-800">
                  {item.title}
                </p>
                <p className="line-clamp-1 text-xs font-normal text-slate-500">
                  {item.subtitle}
                </p>
              </div>
              <span className="whitespace-nowrap text-[11px] font-normal text-slate-400">
                {formatDate(item.occurredAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
