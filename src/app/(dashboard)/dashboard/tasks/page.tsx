'use client';
/* eslint-disable @next/next/no-img-element */

import {
  getTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  createTaskComment,
  updateTaskDescription,
} from '@/app/actions/tasks';
import { CreateTaskData } from '@/app/types/tasks';
import { getStaffProfiles, StaffProfile } from '@/app/actions/staff';
import { toast } from 'sonner';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  X,
  Calendar,
  User,
  Tag,
  MessageSquare,
  Paperclip,
  ListTodo,
  BarChart3,
  FileText,
  Image as ImageIcon,
  Trash2,
  Pencil,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useWebSocket, useWebSocketSubscription } from '@/lib/websocket';

type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
type TaskPriority = 'Low' | 'Medium' | 'High';

type Assignee = {
  name: string;
  avatar: string;
  department: string;
};

type Comment = {
  id: number;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
};

type Attachment = {
  id: number;
  name: string;
  size: string;
  type: 'pdf' | 'image' | string;
};

type Subtask = {
  id: number;
  title: string;
  completed: boolean;
};

type Task = {
  id: number;
  title: string;
  description: string;
  assignee: Assignee;
  status: TaskStatus;
  statusColor: string;
  priority: TaskPriority;
  priorityColor: string;
  dueDate: string;
  dueIn: string;
  progress?: number;
  tags: string[];
  created: string;
  organization?: string;
  timeSpent?: string;
  estimatedTime?: string;
  comments?: Comment[];
  attachments?: Attachment[];
  subtasks?: Subtask[];
  originalStatus?: TaskStatus;
  originalStatusColor?: string;
};

type NewTaskForm = {
  title: string;
  description: string;
  assignee: string;
  organization: string;
  priority: TaskPriority;
  dueDate: string;
  dueTime: string;
  tags: string[];
  subtasks: { title: string }[];
  attachments: File[];
};

type UserProfile = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  employee_id?: string | null;
  role?: string | null;
  department?: string | null;
  avatar_url?: string | null;
};

// ... inside component ...
export default function TaskManagementPage() {
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  // ... existing state ...
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescriptionText, setEditDescriptionText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load user profile from cookie (set by login action)
  useEffect(() => {
    const loadUserProfile = async () => {
      // Get user info from cookie
      const userInfoCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('user_info='));
      if (userInfoCookie) {
        try {
          const cookieValue = userInfoCookie.split('=')[1];
          if (cookieValue) {
            const userInfo = JSON.parse(decodeURIComponent(cookieValue));
            setUserProfile(userInfo);
          }
        } catch (e) {
          console.error('Failed to parse user_info cookie:', e);
        }
      }
    };
    loadUserProfile();
  }, []);

  // WebSocket connection status
  const { isConnected } = useWebSocket();

  // Refresh tasks function
  const refreshTasks = useCallback(async () => {
    try {
      const tasks = await getTasks();
      setTaskList(tasks as unknown as Task[]);
    } catch {
      console.error('Failed to refresh tasks');
    }
  }, []);

  // Subscribe to task updates via WebSocket
  useWebSocketSubscription('notification', (data) => {
    console.log('📥 Task notification received:', data);
    // Refresh tasks when we get any notification
    refreshTasks();
  }, [refreshTasks]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [tasks, staff] = await Promise.all([
          getTasks(),
          getStaffProfiles(),
        ]);
        setTaskList(tasks as unknown as Task[]);
        setStaffList(staff);
      } catch {
        toast.error('Failed to load tasks');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    // Reduced polling since WebSocket handles real-time (fallback every 2 minutes)
    const intervalId = setInterval(() => {
      refreshTasks();
    }, 120000);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshTasks]);

  // Calculate metrics
  const totalTasks = taskList.length;
  const inProgress = taskList.filter((t) => t.status === 'In Progress').length;
  const completed = taskList.filter((t) => t.status === 'Completed').length;
  const overdue = taskList.filter((t) => t.status === 'Overdue').length;

  const summaryMetrics = [
    {
      label: 'Total Tasks',
      value: totalTasks.toString(),
      detail: 'all time',
      icon: Clock,
      color: 'text-primary',
    },
    {
      label: 'In Progress',
      value: inProgress.toString(),
      detail: `${totalTasks > 0 ? Math.round((inProgress / totalTasks) * 100) : 0}% of total`,
      icon: Clock,
      color: 'text-blue-600',
    },
    {
      label: 'Completed',
      value: completed.toString(),
      detail: `${totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0}% completion`,
      icon: CheckCircle2,
      color: 'text-emerald-600',
    },
    {
      label: 'Overdue',
      value: overdue.toString(),
      detail: 'Needs attention',
      icon: AlertCircle,
      color: 'text-red-600',
    },
  ];
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'All'>(
    'All'
  );
  const [selectedPriority, setSelectedPriority] = useState<
    TaskPriority | 'All'
  >('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [newTask, setNewTask] = useState<NewTaskForm>({
    title: '',
    description: '',
    assignee: '',
    organization: '',
    priority: 'Medium',
    dueDate: '',
    dueTime: '',
    tags: [],
    subtasks: [],
    attachments: [],
  });
  const recordsPerPage = 5;
  const statusFilters: (TaskStatus | 'All')[] = [
    'All',
    'Pending',
    'In Progress',
    'Completed',
    'Overdue',
  ];
  const priorityFilters: (TaskPriority | 'All')[] = [
    'All',
    'High',
    'Medium',
    'Low',
  ];

  // Unique departments from staff list
  // Unique departments from staff list
  const departments = [
    'All',
    ...Array.from(
      new Set(staffList.map((s) => s.department || 'Unassigned'))
    ).filter((d) => d !== 'All' && d !== 'Unassigned' && d !== 'Unknown'),
  ];

  // Filtered assignees based on selected department in modal
  const baseAssignees = staffList.filter(
    (s) =>
      !newTask.organization ||
      newTask.organization === '' ||
      s.department === newTask.organization
  );

  // Include the current admin user (self-assignment option)
  const validAssignees = userProfile
    ? [
      // Add admin as first option with a special marker
      {
        id: userProfile.id,
        full_name: userProfile.full_name || 'Admin',
        department: userProfile.department || 'Admin',
        email: userProfile.email,
        role: userProfile.role,
        isSelf: true, // Marker to identify self
      } as StaffProfile & { isSelf?: boolean },
      // Filter out the admin from staff list if they appear there
      ...baseAssignees.filter((s) => s.id !== userProfile.id),
    ]
    : baseAssignees;

  const availableTags = [
    'Documentation',
    'Onboarding',
    'HR',
    'Reviews',
    'Engineering',
    'Integration',
    'Reports',
    'Sales',
    'Marketing',
    'Website',
  ];

  const filteredTasks = taskList.filter((task) => {
    const matchesStatus =
      selectedStatus === 'All' || task.status === selectedStatus;
    const matchesPriority =
      selectedPriority === 'All' || task.priority === selectedPriority;
    const matchesSearch =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const selectedTask = selectedTaskId
    ? (taskList.find((task) => task.id === selectedTaskId) ?? null)
    : null;
  const completedSubtasks =
    selectedTask?.subtasks?.filter((subtask) => subtask.completed).length ?? 0;
  const totalSubtasks = selectedTask?.subtasks?.length ?? 0;
  const attachmentCount = selectedTask?.attachments?.length ?? 0;
  const commentCount = selectedTask?.comments?.length ?? 0;

  const toggleTaskCompletion = async (taskId: number) => {
    // 1. Optimistic Update
    setTaskList((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const isCompleted = task.status === 'Completed';
        const nextStatus = isCompleted ? 'Pending' : 'Completed';
        const nextStatusColor = isCompleted
          ? 'bg-gray-100 text-gray-700'
          : 'bg-emerald-100 text-emerald-700';
        const nextProgress = isCompleted ? 0 : 100;

        return {
          ...task,
          status: nextStatus,
          statusColor: nextStatusColor,
          progress: nextProgress,
        };
      })
    );

    // 2. Server Action
    const task = taskList.find((t) => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      const res = await updateTaskStatus(taskId, newStatus);
      if (!res.success) throw new Error(res.error);
      const updated = await getTasks();
      setTaskList(updated as unknown as Task[]);
    } catch {
      toast.error('Failed to update status');
      // Revert (reload all)
      const all = await getTasks();
      setTaskList(all as unknown as Task[]);
    }
  };

  const currentTasks = filteredTasks.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">Task Management</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Track and assign tasks across the organization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Real-time connection indicator */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${isConnected
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-gray-100 text-gray-500'
              }`}
            title={isConnected ? 'Real-time updates active' : 'Polling for updates'}
          >
            {isConnected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {isConnected ? 'Live' : 'Polling'}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            New Task
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-xl border border-border/40 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  {metric.label}
                </p>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
              <p className="mb-1 text-3xl font-normal tracking-tight text-gray-800">
                {metric.value}
              </p>
              <p className="text-xs text-muted-foreground">{metric.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="rounded-xl border border-border/40 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="max-w-md flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Status:
              </span>
              <div className="flex items-center gap-1">
                {statusFilters.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedStatus === status
                      ? 'bg-primary text-white'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Priority:
              </span>
              <div className="flex items-center gap-1">
                {priorityFilters.map((priority) => (
                  <button
                    key={priority}
                    onClick={() => setSelectedPriority(priority)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedPriority === priority
                      ? 'bg-primary text-white'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
        <div className="border-b border-border/40 p-6">
          <div>
            <h2 className="text-sm font-normal text-gray-700">All Tasks</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage and track task progress across teams.
            </p>
          </div>
        </div>

        {/* Tasks List */}
        <div className="divide-y divide-border/40">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center justify-between p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-4 w-4 rounded bg-slate-200" />{' '}
                  {/* Checkbox */}
                  <div>
                    <div className="mb-2 h-4 w-48 rounded bg-slate-200" />
                    <div className="h-3 w-32 rounded bg-slate-200" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-slate-200" />
                  <div className="h-4 w-20 rounded bg-slate-200" />
                </div>
              </div>
            ))
          ) : currentTasks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-gray-100 p-3">
                <ListTodo className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">
                No tasks found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || selectedStatus !== 'All'
                  ? 'No tasks match your filters.'
                  : "You haven't created any tasks yet."}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
                >
                  <Plus className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                  New Task
                </button>
              </div>
            </div>
          ) : (
            currentTasks.map((task) => (
              <div
                key={task.id}
                className="cursor-pointer p-6 transition-colors hover:bg-muted/20"
                onClick={() => setSelectedTaskId(task.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={task.status === 'Completed'}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleTaskCompletion(task.id);
                          }}
                          className="h-4 w-4 rounded border-border/40 text-primary focus:ring-primary"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="mb-1 text-sm font-medium text-gray-800">
                              {task.title}
                            </h3>
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {task.description}
                            </p>
                          </div>
                          <button className="flex-shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Tags */}
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          {task.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Task Meta */}
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          {/* Assignee */}
                          <div className="flex items-center gap-2">
                            <img
                              src={task.assignee.avatar}
                              alt={task.assignee.name}
                              className="h-5 w-5 rounded-full ring-2 ring-white"
                            />
                            <span className="text-gray-700">
                              {task.assignee.name}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {task.assignee.department}
                            </span>
                          </div>

                          {/* Status and Priority */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${task.statusColor}`}
                            >
                              {task.status}
                            </span>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${task.priorityColor}`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          {/* Due Date */}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span
                              className={`${task.status === 'Overdue' ? 'text-red-600' : 'text-muted-foreground'}`}
                            >
                              {task.dueIn}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {task.status === 'In Progress' && (
                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground">
                                Progress
                              </span>
                              <span className="text-[10px] font-medium text-gray-700">
                                {task.progress}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredTasks.length > 0 && (
          <div className="flex items-center justify-between border-t border-border/40 px-6 py-4">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * recordsPerPage + 1}-
              {Math.min(currentPage * recordsPerPage, filteredTasks.length)} of{' '}
              {filteredTasks.length} tasks
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage * recordsPerPage >= filteredTasks.length}
                className="rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border/40 bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-border/40 p-4">
              <div>
                <h3 className="text-base font-medium text-gray-800">
                  Create New Task
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Assign and track tasks across your organization.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTask({
                    title: '',
                    description: '',
                    assignee: '',
                    organization: '',
                    priority: 'Medium',
                    dueDate: '',
                    dueTime: '',
                    tags: [],
                    subtasks: [],
                    attachments: [],
                  });
                }}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {/* Title */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  placeholder="Enter task title"
                  className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  placeholder="Enter task description"
                  rows={4}
                  className="w-full resize-none rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Organization and Assignee */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Department *
                  </label>
                  <select
                    value={newTask.organization}
                    onChange={(e) =>
                      setNewTask({ ...newTask, organization: e.target.value })
                    }
                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select Department</option>
                    {departments
                      .filter((dept) => dept !== 'All')
                      .map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Assignee *
                  </label>
                  <select
                    value={newTask.assignee || ''}
                    onChange={(e) =>
                      setNewTask({ ...newTask, assignee: e.target.value })
                    }
                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select assignee</option>
                    {validAssignees.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name} {staff.id === userProfile?.id ? '(Me)' : `(${staff.department})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority and Due Date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Priority *
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        priority: e.target.value as TaskPriority,
                      })
                    }
                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={newTask.dueTime}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueTime: e.target.value })
                    }
                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Tags
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {newTask.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {tag}
                      <button
                        onClick={() => {
                          setNewTask({
                            ...newTask,
                            tags: newTask.tags.filter((_, i) => i !== idx),
                          });
                        }}
                        className="hover:text-primary/70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select
                    value=""
                    onChange={(e) => {
                      if (
                        e.target.value &&
                        !newTask.tags.includes(e.target.value)
                      ) {
                        setNewTask({
                          ...newTask,
                          tags: [...newTask.tags, e.target.value],
                        });
                      }
                    }}
                    className="flex-1 rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Add existing tag</option>
                    {availableTags
                      .filter((tag) => !newTask.tags.includes(tag))
                      .map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                  </select>
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      placeholder="Or type custom tag"
                      className="flex-1 rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (
                            customTag.trim() &&
                            !newTask.tags.includes(customTag.trim())
                          ) {
                            setNewTask({
                              ...newTask,
                              tags: [...newTask.tags, customTag.trim()],
                            });
                            setCustomTag('');
                          }
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault(); // Prevent form submission if inside form
                        if (
                          customTag.trim() &&
                          !newTask.tags.includes(customTag.trim())
                        ) {
                          setNewTask({
                            ...newTask,
                            tags: [...newTask.tags, customTag.trim()],
                          });
                          setCustomTag('');
                        }
                      }}
                      disabled={!customTag.trim()}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-white text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Subtasks */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">
                    Subtasks
                  </label>
                  <button
                    onClick={() =>
                      setNewTask({
                        ...newTask,
                        subtasks: [...newTask.subtasks, { title: '' }],
                      })
                    }
                    className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80"
                  >
                    <Plus className="h-3 w-3" />
                    Add Subtask
                  </button>
                </div>
                <div className="space-y-2">
                  {newTask.subtasks.map((subtask, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={subtask.title}
                        onChange={(e) => {
                          const updated = [...(newTask.subtasks || [])];
                          if (updated[idx]) {
                            updated[idx] = {
                              ...updated[idx],
                              title: e.target.value,
                            };
                            setNewTask({ ...newTask, subtasks: updated });
                          }
                        }}
                        placeholder={`Subtask ${idx + 1}`}
                        className="flex-1 rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        onClick={() => {
                          setNewTask({
                            ...newTask,
                            subtasks: newTask.subtasks.filter(
                              (_, i) => i !== idx
                            ),
                          });
                        }}
                        className="text-muted-foreground hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {newTask.subtasks.length === 0 && (
                    <p className="text-[10px] italic text-muted-foreground">
                      No subtasks added yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-700">
                  Attachments
                </label>
                <div className="rounded-lg border border-dashed border-border/40 bg-gray-50/50 p-4">
                  <div className="space-y-3">
                    {newTask.attachments.length > 0 && (
                      <div className="space-y-2">
                        {newTask.attachments.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-md border border-border/40 bg-white p-2"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              {file.type.includes('image') ? (
                                <ImageIcon className="h-4 w-4 flex-shrink-0 text-blue-500" />
                              ) : (
                                <FileText className="h-4 w-4 flex-shrink-0 text-red-500" />
                              )}
                              <span className="truncate text-xs text-gray-700">
                                {file.name}
                              </span>
                              <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setNewTask({
                                  ...newTask,
                                  attachments: newTask.attachments.filter(
                                    (_, i) => i !== idx
                                  ),
                                });
                              }}
                              className="text-muted-foreground hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-center">
                      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted/50 hover:text-foreground">
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>Upload Files</span>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              setNewTask({
                                ...newTask,
                                attachments: [
                                  ...newTask.attachments,
                                  ...Array.from(e.target.files),
                                ],
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border/40 p-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTask({
                    title: '',
                    description: '',
                    assignee: '',
                    organization: '',
                    priority: 'Medium',
                    dueDate: '',
                    dueTime: '',
                    tags: [],
                    subtasks: [],
                    attachments: [],
                  });
                }}
                className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={async () => {
                  if (!newTask.title || !newTask.description) {
                    toast.error('Please fill in required fields');
                    return;
                  }

                  setIsSubmitting(true);
                  try {
                    // Upload attachments to Cloudinary first
                    const uploadedAttachments: { name: string; size: number; type: string; url: string; path: string }[] = [];

                    if (newTask.attachments.length > 0) {
                      toast.info('Uploading attachments...');

                      for (const file of newTask.attachments) {
                        try {
                          // Create FormData and upload via API route
                          const formData = new FormData();
                          formData.append('file', file);

                          const uploadRes = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData,
                          });

                          if (uploadRes.ok) {
                            const result = await uploadRes.json();
                            uploadedAttachments.push({
                              name: file.name,
                              size: file.size,
                              type: file.type,
                              url: result.url,
                              path: result.publicId || '',
                            });
                          } else {
                            console.error('Failed to upload file:', file.name);
                          }
                        } catch (uploadErr) {
                          console.error('Error uploading file:', file.name, uploadErr);
                        }
                      }

                      if (uploadedAttachments.length > 0) {
                        toast.success(`Uploaded ${uploadedAttachments.length} file(s)`);
                      } else if (newTask.attachments.length > 0) {
                        toast.warning('Could not upload attachments. Creating task without them.');
                      }
                    }

                    const taskPayload: CreateTaskData = {
                      ...newTask,
                      attachments: uploadedAttachments,
                    };

                    const res = await createTask(taskPayload);
                    if (res.success) {
                      toast.success('Task created successfully');
                      const updatedTasks = await getTasks();
                      setTaskList(updatedTasks as unknown as Task[]);
                      setShowCreateModal(false);
                      setNewTask({
                        title: '',
                        description: '',
                        assignee: '',
                        organization: '',
                        priority: 'Medium',
                        dueDate: '',
                        dueTime: '',
                        tags: [],
                        subtasks: [],
                        attachments: [],
                      });
                    } else {
                      toast.error(res.error || 'Failed to create task');
                    }
                  } catch {
                    toast.error('An unexpected error occurred');
                  }
                  setIsSubmitting(false);
                }}
                className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border/40 bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-border/40 p-4">
              <div className="flex flex-1 items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedTask.status === 'Completed'}
                  onChange={() => toggleTaskCompletion(selectedTask.id)}
                  className="mt-1 h-4 w-4 rounded border-border/40 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <h3 className="mb-1 text-base font-medium text-gray-800">
                    {selectedTask.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${selectedTask.statusColor}`}
                    >
                      {selectedTask.status}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${selectedTask.priorityColor}`}
                    >
                      {selectedTask.priority}
                    </span>
                    {selectedTask.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex rounded-full bg-muted/50 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTaskId(null)}
                className="flex-shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {/* Description */}
              {/* Description */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-medium text-gray-700">
                    Description
                  </h4>
                  {!isEditingDescription && (
                    <button
                      onClick={() => {
                        setEditDescriptionText(selectedTask.description);
                        setIsEditingDescription(true);
                      }}
                      className="p-1 text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {isEditingDescription ? (
                  <div className="space-y-2">
                    <textarea
                      value={editDescriptionText}
                      onChange={(e) => setEditDescriptionText(e.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingDescription(false)}
                        className="px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          setIsEditingDescription(false);
                          const res = await updateTaskDescription(
                            selectedTask.id,
                            editDescriptionText
                          );
                          if (res.success) {
                            toast.success('Description updated');
                            const updated = await getTasks();
                            setTaskList(updated as unknown as Task[]);
                          } else {
                            toast.error('Failed to update description');
                          }
                        }}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                    {selectedTask.description}
                  </p>
                )}
              </div>

              {/* Task Details Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Assignee */}
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted/50 p-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Assigned To
                    </p>
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedTask.assignee.avatar}
                        alt={selectedTask.assignee.name}
                        className="h-5 w-5 rounded-full ring-2 ring-white"
                      />
                      <p className="text-sm font-medium text-gray-800">
                        {selectedTask.assignee.name}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedTask.assignee.department}
                    </p>
                  </div>
                </div>

                {/* Due Date */}
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted/50 p-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Due Date
                    </p>
                    <p
                      className={`text-sm font-medium ${selectedTask.status === 'Overdue' ? 'text-red-600' : 'text-gray-800'}`}
                    >
                      {new Date(selectedTask.dueDate).toLocaleDateString(
                        'en-US',
                        {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                    </p>
                    <p
                      className={`text-xs ${selectedTask.status === 'Overdue' ? 'text-red-600' : 'text-muted-foreground'}`}
                    >
                      {selectedTask.dueIn}
                    </p>
                  </div>
                </div>

                {/* Created Date */}
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted/50 p-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Created
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(selectedTask.created).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted/50 p-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Status
                    </p>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${selectedTask.statusColor}`}
                    >
                      {selectedTask.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {selectedTask.status === 'In Progress' && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-medium text-gray-700">
                      Progress
                    </h4>
                    <span className="text-xs font-medium text-gray-700">
                      {selectedTask.progress}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${selectedTask.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Organization and Time Tracking */}
              <div className="grid grid-cols-1 gap-4 border-t border-border/40 pt-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted/50 p-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Organization
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      {selectedTask.organization ??
                        selectedTask.assignee.department}
                    </p>
                  </div>
                </div>
                {selectedTask.timeSpent && (
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-muted/50 p-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                        Time Tracking
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        {selectedTask.timeSpent} /{' '}
                        {selectedTask.estimatedTime || 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Subtasks */}
              {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-700">
                    <ListTodo className="h-3.5 w-3.5" />
                    Subtasks ({completedSubtasks}/{totalSubtasks})
                  </h4>
                  <div className="space-y-2">
                    {(selectedTask.subtasks || []).map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 rounded-lg border border-border/40 bg-white p-2"
                      >
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          className="h-4 w-4 rounded border-border/40 text-primary focus:ring-primary"
                        />
                        <span
                          className={`flex-1 text-xs ${subtask.completed ? 'text-muted-foreground line-through' : 'text-gray-800'}`}
                        >
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedTask.attachments &&
                selectedTask.attachments.length > 0 && (
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-700">
                      <Paperclip className="h-3.5 w-3.5" />
                      Attachments ({attachmentCount})
                    </h4>
                    <div className="space-y-2">
                      {(selectedTask.attachments || []).map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/40 bg-white p-3 transition-colors hover:bg-muted/20"
                        >
                          {attachment.type === 'pdf' ? (
                            <FileText className="h-5 w-5 text-red-500" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-blue-500" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-gray-800">
                              {attachment.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {attachment.size}
                            </p>
                          </div>
                          <button className="text-xs font-medium text-primary hover:text-primary/80">
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Comments */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-700">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Comments ({commentCount})
                </h4>
                <div className="space-y-4">
                  {(selectedTask.comments || []).map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3">
                      <img
                        src={comment.avatar}
                        alt={comment.author}
                        className="h-8 w-8 flex-shrink-0 rounded-full ring-2 ring-white"
                      />
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="text-xs font-medium text-gray-800">
                            {comment.author}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(comment.timestamp).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </p>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-700">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-start gap-3 border-t border-border/40 pt-2">
                    <img
                      src={
                        userProfile?.avatar_url ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.employee_id || userProfile?.email || userProfile?.full_name || 'User'}`
                      }
                      alt="You"
                      className="h-8 w-8 flex-shrink-0 rounded-full ring-2 ring-white"
                    />
                    <div className="flex-1">
                      <textarea
                        placeholder="Add a comment..."
                        rows={2}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full resize-none rounded-lg border border-border/40 bg-white px-3 py-2 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        onClick={async () => {
                          if (!newComment.trim()) return;
                          setIsPostingComment(true);
                          const res = await createTaskComment(
                            selectedTask.id,
                            newComment
                          );
                          if (res.success) {
                            toast.success('Comment posted');
                            setNewComment('');
                            // Refresh tasks to show new comment
                            const updatedTasks = await getTasks();
                            setTaskList(updatedTasks as unknown as Task[]);
                            // Update selected task view via setTaskList triggering re-render of derived selectedTask
                            // const updatedSelected = updatedTasks.find((t: any) => t.id === selectedTask.id);
                            // if (updatedSelected) setSelectedTask(updatedSelected as any);
                          } else {
                            toast.error('Failed to post comment');
                          }
                          setIsPostingComment(false);
                        }}
                        disabled={isPostingComment || !newComment.trim()}
                        className="mt-2 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50"
                      >
                        {isPostingComment ? 'Posting...' : 'Post comment'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div>
                <h4 className="mb-3 text-xs font-medium text-gray-700">
                  Activity Timeline
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary"></div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-800">
                        Task created by{' '}
                        <span className="font-medium">
                          {userProfile?.full_name}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {new Date(selectedTask.created).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-800">
                        Task assigned to{' '}
                        <span className="font-medium">
                          {selectedTask.assignee.name}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {new Date(selectedTask.created).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  {selectedTask.status === 'In Progress' && (
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500"></div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-800">
                          Status changed to{' '}
                          <span className="font-medium">In Progress</span> by{' '}
                          {selectedTask.assignee.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {new Date(selectedTask.created).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-shrink-0 items-center justify-between border-t border-border/40 p-4">
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    setIsDeleting(true);
                    const res = await deleteTask(selectedTask.id);
                    if (res.success) {
                      toast.success('Task deleted');
                      setSelectedTaskId(null);
                      const updated = await getTasks();
                      setTaskList(updated as unknown as Task[]);
                    } else {
                      toast.error('Failed to delete task');
                    }
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTaskId(null)}
                  className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
