'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Clock,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  Save,
  X,
  PlayCircle,
  PauseCircle,
  Zap,
  Send,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  getReferenceData,
  type ReferenceData,
} from '@/app/actions/reference-data';
import {
  getSmartReminders,
  createSmartReminder,
  updateSmartReminder,
  toggleSmartReminder,
  deleteSmartReminder,
  triggerSmartReminder,
  type SmartReminder,
} from '@/app/actions/smart-reminders';

const REMINDER_TYPE_LABELS: Record<
  SmartReminder['type'],
  { label: string; color: string; icon: React.ReactNode }
> = {
  check_in: {
    label: 'Check-in',
    color: '#10b981',
    icon: <Clock className="h-4 w-4" />,
  },
  task_due: {
    label: 'Task Due',
    color: '#f59e0b',
    icon: <Calendar className="h-4 w-4" />,
  },
  report_submission: {
    label: 'Report',
    color: '#3b82f6',
    icon: <Send className="h-4 w-4" />,
  },
  peer_feedback: {
    label: 'Feedback',
    color: '#8b5cf6',
    icon: <Users className="h-4 w-4" />,
  },
  aura_penalty: {
    label: 'Aura Penalty',
    color: '#ef4444',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  custom: {
    label: 'Custom',
    color: '#6b7280',
    icon: <Bell className="h-4 w-4" />,
  },
};

export default function SmartRemindersPage() {
  const [reminders, setReminders] = useState<SmartReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<SmartReminder | null>(
    null
  );
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'check_in' as SmartReminder['type'],
    time: '09:00',
    days: [] as string[],
    message: '',
    targetAudience: 'pending_only' as SmartReminder['targetAudience'],
    isActive: true,
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const refs = await getReferenceData();
        setReferenceData(refs);
        setFormData((prev) => ({
          ...prev,
          days: prev.days.length > 0 ? prev.days : refs.daysOfWeek.slice(0, 5),
        }));
      } catch (err) {
        console.warn('Failed to load reference data:', err);
      }
    };
    loadReferenceData();
  }, []);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const data = await getSmartReminders();
      setReminders(data.reminders || []);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      toast.error('Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = (reminder?: SmartReminder) => {
    if (reminder) {
      setEditingReminder(reminder);
      setFormData({
        name: reminder.name,
        description: reminder.description,
        type: reminder.type,
        time: reminder.schedule.time,
        days: reminder.schedule.days,
        message: reminder.message,
        targetAudience: reminder.targetAudience,
        isActive: reminder.isActive,
      });
    } else {
      setEditingReminder(null);
      const defaultDays = referenceData?.daysOfWeek?.slice(0, 5) ?? [];
      setFormData({
        name: '',
        description: '',
        type: 'check_in',
        time: '09:00',
        days: defaultDays,
        message: '',
        targetAudience: 'pending_only',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.message || formData.days.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        scheduleTime: formData.time,
        scheduleDays: formData.days,
        timezone: 'Africa/Lagos',
        targetAudience: formData.targetAudience,
        message: formData.message,
        channels: ['push'],
      };

      if (editingReminder) {
        const result = await updateSmartReminder(editingReminder.id, payload);
        if (!result.success) {
          toast.error(result.error || 'Failed to update reminder');
          return;
        }
        toast.success('Reminder updated successfully');
      } else {
        const result = await createSmartReminder(payload);
        if (!result.success) {
          toast.error(result.error || 'Failed to create reminder');
          return;
        }
        toast.success('New reminder created successfully');
      }

      setIsDialogOpen(false);
      await fetchReminders(); // Refresh list
    } catch (err) {
      console.error('Error saving reminder:', err);
      toast.error('Failed to save reminder');
    }
  };

  const handleDelete = async (reminderId: string) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      try {
        const result = await deleteSmartReminder(reminderId);
        if (!result.success) {
          toast.error(result.error || 'Failed to delete reminder');
          return;
        }
        toast.success('Reminder deleted successfully');
        await fetchReminders();
      } catch (err) {
        console.error('Error deleting reminder:', err);
        toast.error('Failed to delete reminder');
      }
    }
  };

  const reminderTypes = referenceData?.smartReminderTypes ?? [];
  const daysOfWeek = referenceData?.daysOfWeek ?? [];
  const reminderTargets = referenceData?.smartReminderTargets ?? [];

  const getReminderTypeMeta = (type: SmartReminder['type']) => {
    const fallback = REMINDER_TYPE_LABELS[type];
    const label =
      reminderTypes.find((entry) => entry.value === type)?.label ??
      fallback.label;
    return { ...fallback, label };
  };

  const toggleReminder = async (reminderId: string) => {
    try {
      const result = await toggleSmartReminder(reminderId);
      if (!result.success) {
        toast.error(result.error || 'Failed to toggle reminder');
        return;
      }
      toast.success(
        result.reminder?.isActive ? 'Reminder activated' : 'Reminder paused'
      );
      await fetchReminders();
    } catch (err) {
      console.error('Error toggling reminder:', err);
      toast.error('Failed to toggle reminder');
    }
  };

  const triggerNow = async (reminder: SmartReminder) => {
    try {
      const result = await triggerSmartReminder(reminder.id);
      if (!result.success) {
        toast.error(result.error || 'Failed to trigger reminder');
        return;
      }
      toast.success(`Reminder "${reminder.name}" triggered manually`);
      await fetchReminders();
    } catch (err) {
      console.error('Error triggering reminder:', err);
      toast.error('Failed to trigger reminder');
    }
  };

  const activeReminders = reminders.filter((r) => r.isActive).length;
  const totalTriggers = reminders.reduce((sum, r) => sum + r.triggerCount, 0);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">Smart Reminders</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Automate notifications for pending actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchReminders}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => openDialog()}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Reminder
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/40">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-2">
                <Bell className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Active Reminders
              </span>
            </div>
            <p className="text-3xl font-normal text-emerald-600">
              {activeReminders}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              of {reminders.length} total
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Total Triggered
              </span>
            </div>
            <p className="text-3xl font-normal">{totalTriggers}</p>
            <p className="mt-1 text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Today&apos;s Reminders
              </span>
            </div>
            <p className="text-3xl font-normal">
              {
                reminders.filter(
                  (r) =>
                    r.isActive &&
                    r.schedule.days.includes(
                      new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                      })
                    )
                ).length
              }
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set to trigger today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reminders List */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-normal">All Reminders</CardTitle>
          <CardDescription className="text-xs">
            Configure automated notifications for various actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const typeInfo = getReminderTypeMeta(reminder.type);
              return (
                <div
                  key={reminder.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    reminder.isActive
                      ? 'border-border/40 bg-white hover:bg-muted/10'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`rounded-lg p-2.5`}
                        style={{ backgroundColor: `${typeInfo.color}20` }}
                      >
                        <span style={{ color: typeInfo.color }}>
                          {typeInfo.icon}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium">
                            {reminder.name}
                          </h3>
                          <Badge
                            className="border-0 text-[9px]"
                            style={{
                              backgroundColor: `${typeInfo.color}20`,
                              color: typeInfo.color,
                            }}
                          >
                            {typeInfo.label}
                          </Badge>
                          <Badge
                            className={
                              reminder.isActive
                                ? 'border-0 bg-emerald-100 text-emerald-700'
                                : 'border-0 bg-gray-100 text-gray-600'
                            }
                          >
                            {reminder.isActive ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {reminder.description}
                        </p>
                        <div className="mt-2 flex items-center gap-4">
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {reminder.schedule.time}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {reminder.schedule.days.length === 5 &&
                            reminder.schedule.days.includes('Monday')
                              ? 'Weekdays'
                              : reminder.schedule.days.length === 7
                                ? 'Every day'
                                : reminder.schedule.days.join(', ')}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {reminder.targetAudience === 'pending_only'
                              ? 'Pending only'
                              : 'All staff'}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            {(reminder.channels && reminder.channels.length > 0
                              ? reminder.channels
                              : ['push']
                            ).map((channel) => (
                              <Badge
                                key={channel}
                                variant="outline"
                                className="px-1.5 py-0 text-[9px]"
                              >
                                {channel}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="mr-4 text-right">
                        <p className="text-lg font-semibold">
                          {reminder.triggerCount}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Triggers
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => triggerNow(reminder)}
                        className="h-8 w-8 p-0"
                        title="Trigger now"
                      >
                        <Zap className="h-4 w-4 text-amber-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleReminder(reminder.id)}
                        className="h-8 w-8 p-0"
                        title={reminder.isActive ? 'Pause' : 'Activate'}
                      >
                        {reminder.isActive ? (
                          <PauseCircle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <PlayCircle className="h-4 w-4 text-emerald-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(reminder)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(reminder.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Message preview */}
                  <div className="mt-3 rounded bg-muted/30 p-3 text-xs text-muted-foreground">
                    <strong>Message:</strong> {reminder.message}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info box */}
          <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-blue-800">
                  How Smart Reminders Work
                </p>
                <p className="mt-1 text-[11px] text-blue-700">
                  Reminders automatically identify users who haven&apos;t
                  completed the relevant action and send notifications via push
                  only. Set &quot;Pending Only&quot; to avoid notifying users
                  who have already completed the action.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Reminder Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-normal">
              {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">
                Reminder Name *
              </label>
              <Input
                placeholder="e.g., Morning Check-in Reminder"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">
                Description
              </label>
              <Input
                placeholder="Brief description of what this reminder does"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as SmartReminder['type'],
                    })
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {reminderTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Time *
                </label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">
                Days *
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const days = formData.days.includes(day)
                        ? formData.days.filter((d) => d !== day)
                        : [...formData.days, day];
                      setFormData({ ...formData, days });
                    }}
                    className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                      formData.days.includes(day)
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">
                Target Audience
              </label>
              <div className="flex gap-2">
                {reminderTargets.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        targetAudience:
                          value as SmartReminder['targetAudience'],
                      })
                    }
                    className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                      formData.targetAudience === value
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">
                Channels
              </label>
              <div className="rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Push notifications only
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">
                Message *
              </label>
              <textarea
                placeholder="The notification message to send"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                rows={3}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-[11px] text-muted-foreground">
                  {formData.isActive
                    ? 'Reminder will trigger on schedule'
                    : 'Reminder is paused'}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, isActive: !formData.isActive })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isActive ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="mr-1.5 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-1.5 h-4 w-4" />
              {editingReminder ? 'Update Reminder' : 'Create Reminder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
