'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { CalendarClock, Plus, Search, Users } from 'lucide-react';
import {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} from '@/app/actions/announcements';
import { toast } from 'sonner';
import Loading from './loading';

type AnnouncementItem = {
  id: string;
  title: string;
  summary: string;
  status: 'Published' | 'Draft' | 'Scheduled';
  publishedAt: string;
  audience: string;
  author: string;
  tags: string[];
  pinned?: boolean;
  originalContent: string;
  scheduledAt: string;
};

export default function AnnouncementsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [items, setItems] = useState<AnnouncementItem[]>([]);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('All Staff');
  const [content, setContent] = useState('');

  // Scheduling State
  const [scheduledDate, setScheduledDate] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    const data = await getAnnouncements();
    const mapped: AnnouncementItem[] = (data || []).map((a) => ({
      id: a.id,
      title: a.title,
      summary: a.content || '',
      status: (a.status as AnnouncementItem['status']) || 'Published',
      publishedAt: a.scheduled_at
        ? new Date(a.scheduled_at).toLocaleDateString() +
        ' • ' +
        new Date(a.scheduled_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
        : new Date(
          a.created_at ?? new Date().toISOString()
        ).toLocaleDateString() +
        ' • ' +
        new Date(a.created_at ?? new Date().toISOString()).toLocaleTimeString(
          [],
          { hour: '2-digit', minute: '2-digit' }
        ),
      audience: a.audience ?? 'All Staff',
      author: 'Admin',
      tags: [],
      pinned: a.pinned ?? undefined,
      originalContent: a.content ?? '',
      scheduledAt: a.scheduled_at
        ? new Date(a.scheduled_at).toISOString().substring(0, 16)
        : '',
    }));
    setItems(mapped);
    if (mapped.length > 0 && !selectedId && mapped[0]) setSelectedId(mapped[0].id);
    setIsFetching(false);
  }, [selectedId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const startEdit = (announcement: AnnouncementItem) => {
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setContent(announcement.originalContent); // Use original content for editing
    setAudience(announcement.audience);
    setContent(announcement.originalContent); // Use original content for editing
    setAudience(announcement.audience);
    setIsScheduled(!!announcement.scheduledAt);
    setScheduledDate(announcement.scheduledAt);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    setIsLoading(true);
    const res = await deleteAnnouncement(id);
    setIsLoading(false);

    if (res.success) {
      toast.success('Announcement deleted');
      setSelectedId(null);
      fetchAnnouncements();
    } else {
      toast.error(res.error || 'Failed to delete');
    }
  };

  const handleSave = async (
    targetStatus: 'Published' | 'Draft' | 'Scheduled'
  ) => {
    if (!title || !content) {
      toast.error('Please fill in title and content');
      return;
    }

    if (targetStatus === 'Scheduled' && !scheduledDate) {
      toast.error('Please select a date for scheduling');
      return;
    }

    setIsLoading(true);

    let res;
    const payload = {
      title,
      content,
      audience,
      pinned: false,
      status: targetStatus,
      scheduledAt:
        targetStatus === 'Scheduled' && scheduledDate
          ? new Date(scheduledDate).toISOString()
          : null,
    };

    if (editingId) {
      res = await updateAnnouncement(editingId, payload);
    } else {
      res = await createAnnouncement(payload);
    }

    setIsLoading(false);

    if (res.success) {
      toast.success(
        editingId
          ? 'Announcement updated!'
          : targetStatus === 'Draft'
            ? 'Saved to drafts'
            : 'Announcement saved!'
      );
      setIsCreateModalOpen(false);
      // Reset form
      setEditingId(null);
      setTitle('');
      setContent('');
      setAudience('All Staff');
      setScheduledDate('');
      setIsScheduled(false);
      fetchAnnouncements();
    } else {
      toast.error('Failed to save: ' + res.error);
    }
  };

  const summary = useMemo(() => {
    const published = items.filter(
      (item) => item.status === 'Published'
    ).length;
    const scheduled = items.filter(
      (item) => item.status === 'Scheduled'
    ).length;
    const drafts = items.filter((item) => item.status === 'Draft').length;
    return { published, scheduled, drafts };
  }, [items]);

  const filteredAnnouncements = items.filter((item) => {
    const matchesStatus =
      statusFilter === 'All' || item.status === statusFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const selectedAnnouncement = items.find((a) => a.id === selectedId);

  const statusStyles: Record<string, string> = {
    Published: 'bg-primary/10 text-primary',
    Scheduled: 'bg-amber-50 text-amber-700',
    Draft: 'bg-muted text-gray-700',
  };

  if (isFetching) {
    return <Loading />;
  }

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
          <button
            onClick={() => {
              setEditingId(null);
              setTitle('');
              setContent('');
              setTitle('');
              setContent('');
              setAudience('All Staff');
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
          >
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
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === status
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
              onClick={() => setSelectedId(item.id)}
              className={`cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md ${selectedId === item.id
                ? 'border-primary ring-1 ring-primary'
                : 'border-border/40'
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusStyles[item.status]}`}
                    >
                      {item.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {item.publishedAt}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-800">
                    {item.title}
                  </h3>
                  <p className="line-clamp-2 max-w-4xl text-xs leading-relaxed text-muted-foreground">
                    {item.summary}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {filteredAnnouncements.length === 0 && (
            <div className="rounded-xl border border-border/40 bg-white p-10 text-center text-sm text-muted-foreground">
              No announcements found.
            </div>
          )}
        </div>

        {/* Detail View (Sidebar) */}
        <div className="space-y-4">
          {selectedAnnouncement ? (
            <div className="sticky top-6 rounded-xl border border-border/40 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <span
                    className={`mb-3 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusStyles[selectedAnnouncement.status]}`}
                  >
                    {selectedAnnouncement.status}
                  </span>
                  <h2 className="text-xl font-medium text-gray-800">
                    {selectedAnnouncement.title}
                  </h2>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="mb-1 text-muted-foreground">Published</p>
                    <p className="flex items-center gap-2 font-medium text-gray-800">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {selectedAnnouncement.publishedAt}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-muted-foreground">Author</p>
                    <p className="font-medium text-gray-800">
                      {selectedAnnouncement.author}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-muted-foreground">Audience</p>
                    <p className="flex items-center gap-2 font-medium text-gray-800">
                      <Users className="h-3.5 w-3.5" />
                      {selectedAnnouncement.audience}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-6">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                    {selectedAnnouncement.summary}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => startEdit(selectedAnnouncement)}
                    className="flex-1 rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
                  >
                    Edit Announcement
                  </button>
                  <button
                    onClick={() => handleDelete(selectedAnnouncement.id)}
                    className="flex-1 rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/40 bg-white p-10 text-center text-sm text-muted-foreground">
              Select an announcement to view details
            </div>
          )}
        </div>
      </div>

      {/* Create Modal Overlay */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/40 p-4">
              <h3 className="text-lg font-medium text-gray-800">
                {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., Office Closure Notice"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Audience
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                >
                  <option>All Staff</option>
                  <option>Operations</option>
                  <option>Customer Support</option>
                  <option>Development</option>
                  <option>Sales</option>
                  <option>HR</option>
                  <option>Finance</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="h-32 w-full resize-none rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  placeholder="Write your announcement here..."
                ></textarea>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="schedule"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="schedule" className="text-xs text-gray-700">
                      Schedule for later
                    </label>
                  </div>
                </div>

                {isScheduled && (
                  <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Schedule date
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm accent-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-b-xl border-t border-border/40 bg-gray-50/50 p-4">
              <button
                onClick={() => handleSave('Draft')}
                disabled={isLoading}
                className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                Save as Draft
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleSave(isScheduled ? 'Scheduled' : 'Published')
                  }
                  disabled={isLoading}
                  className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isLoading
                    ? 'Saving...'
                    : isScheduled
                      ? 'Schedule'
                      : editingId &&
                        items.find((i) => i.id === editingId)?.status !==
                        'Draft'
                        ? 'Update'
                        : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
