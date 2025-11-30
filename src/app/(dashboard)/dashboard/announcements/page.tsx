'use client';

import { useMemo, useState } from 'react';
import {
  CalendarClock,
  Filter,
  Megaphone,
  Plus,
  Search,
  Users,
} from 'lucide-react';

const announcements = [
  {
    id: 1,
    title: 'New attendance policy rollout',
    summary:
      'A refreshed attendance and check-in policy goes live next Monday. Please review the updated rules and share with your teams.',
    status: 'Published',
    publishedAt: 'Feb 4, 2024 • 09:20 AM',
    audience: 'All staff',
    author: 'HR · Olivia Cole',
    tags: ['Policy', 'Attendance'],
    pinned: true,
  },
  {
    id: 2,
    title: 'Platform maintenance window',
    summary:
      'We will perform a scheduled maintenance on Saturday between 02:00–03:30 AM WAT. Expect brief downtime for dashboards.',
    status: 'Scheduled',
    publishedAt: 'Feb 10, 2024 • 02:00 AM',
    audience: 'Operations, Engineering',
    author: 'IT · Infrastructure',
    tags: ['Maintenance'],
    pinned: false,
  },
  {
    id: 3,
    title: 'Quarterly KPI refresh',
    summary:
      'KPI formulas for Task Completion and Compliance will be updated next week. Managers will receive a walkthrough deck tomorrow.',
    status: 'Draft',
    publishedAt: 'Pending schedule',
    audience: 'Managers',
    author: 'Product · Analytics',
    tags: ['KPI', 'Product'],
    pinned: false,
  },
  {
    id: 4,
    title: 'Customer feedback spotlight',
    summary:
      'Highlighting top feedback themes from January and the next actions we are taking across Support and Operations.',
    status: 'Published',
    publishedAt: 'Feb 2, 2024 • 04:45 PM',
    audience: 'Support, Operations',
    author: 'CX · Emmanuel Ike',
    tags: ['Feedback'],
    pinned: false,
  },
];

const statusStyles: Record<string, string> = {
  Published: 'bg-primary/10 text-primary',
  Scheduled: 'bg-amber-50 text-amber-700',
  Draft: 'bg-muted text-gray-700',
};

export default function AnnouncementsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const summary = useMemo(() => {
    const published = announcements.filter(
      (item) => item.status === 'Published'
    ).length;
    const scheduled = announcements.filter(
      (item) => item.status === 'Scheduled'
    ).length;
    const drafts = announcements.filter(
      (item) => item.status === 'Draft'
    ).length;
    return { published, scheduled, drafts };
  }, []);

  const filteredAnnouncements = announcements.filter((item) => {
    const matchesStatus =
      statusFilter === 'All' || item.status === statusFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">Announcements</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Keep teams aligned with scheduled updates and policy changes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>
          <button className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" />
            New announcement
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Published',
            value: summary.published,
            helper: 'Live to teams',
          },
          {
            label: 'Scheduled',
            value: summary.scheduled,
            helper: 'Queued to go out',
          },
          { label: 'Drafts', value: summary.drafts, helper: 'Awaiting review' },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border/40 bg-white p-4 shadow-sm"
          >
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              {card.label}
            </p>
            <p className="mb-1 text-2xl font-normal tracking-tight text-gray-800">
              {card.value}
            </p>
            <p className="text-xs text-muted-foreground">{card.helper}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-border/40 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {['All', 'Published', 'Scheduled', 'Draft'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-primary text-white'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* List */}
        <div className="space-y-3">
          {filteredAnnouncements.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border border-border/40 bg-white p-5 shadow-sm transition hover:shadow-md ${item.pinned ? 'border-primary/40' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusStyles[item.status]}`}
                    >
                      {item.status}
                    </span>
                    {item.pinned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                        <Megaphone className="h-3.5 w-3.5" />
                        Pinned
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {item.publishedAt}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-800">
                    {item.title}
                  </h3>
                  <p className="max-w-4xl text-xs leading-relaxed text-muted-foreground">
                    {item.summary}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {item.audience}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {item.author}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex rounded-full bg-muted/50 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
                  View
                </button>
              </div>
            </div>
          ))}

          {filteredAnnouncements.length === 0 && (
            <div className="rounded-xl border border-border/40 bg-white p-10 text-center text-sm text-muted-foreground">
              No announcements match your filters.
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border/40 bg-gradient-to-br from-primary/5 to-primary/10 p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  Upcoming
                </p>
                <h3 className="text-base font-medium text-gray-800">
                  Schedule announcements
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Prep messages, approvals, and audience targeting ahead of
                  time.
                </p>
              </div>
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="rounded-md border border-dashed border-primary/30 bg-white/60 px-3 py-2">
                <p className="text-[11px] font-medium text-gray-800">
                  Weekend maintenance
                </p>
                <p>Scheduled · Feb 10, 02:00 AM</p>
              </div>
              <div className="rounded-md border border-dashed border-primary/30 bg-white/60 px-3 py-2">
                <p className="text-[11px] font-medium text-gray-800">
                  KPI refresh briefing
                </p>
                <p>Draft · Needs approver</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border/40 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-800">
                Recent activity
              </p>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <p className="text-gray-800">
                    Maintenance notice scheduled by Infrastructure
                  </p>
                  <p>Today · 09:10 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-muted-foreground/60" />
                <div>
                  <p className="text-gray-800">
                    Draft saved: KPI refresh briefing
                  </p>
                  <p>Yesterday · 05:40 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-muted-foreground/60" />
                <div>
                  <p className="text-gray-800">
                    Policy update sent to all staff
                  </p>
                  <p>Feb 4 · 09:20 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
