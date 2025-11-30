'use client';

import { useState } from 'react';
import {
  Download,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
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
} from 'lucide-react';

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
  tags: string[];
};

// Mock task data
const initialTasks: Task[] = [
  {
    id: 1,
    title: 'Update customer onboarding documentation',
    description:
      'Review and update the customer onboarding process documentation to reflect new compliance requirements.',
    assignee: {
      name: 'Sarah Lee',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      department: 'Sales',
    },
    status: 'In Progress',
    statusColor: 'bg-blue-100 text-blue-700',
    priority: 'High',
    priorityColor: 'bg-red-100 text-red-700',
    dueDate: '2024-01-15',
    dueIn: '2 days',
    progress: 65,
    tags: ['Documentation', 'Onboarding'],
    created: '2024-01-10',
    organization: 'Sales',
    timeSpent: '12h 30m',
    estimatedTime: '16h',
    comments: [
      {
        id: 1,
        author: 'Sarah Lee',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        text: 'Started reviewing the current documentation. Found several sections that need updates.',
        timestamp: '2024-01-10T10:30:00',
      },
      {
        id: 2,
        author: 'Manager',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Manager',
        text: 'Please prioritize the compliance section updates.',
        timestamp: '2024-01-11T14:20:00',
      },
    ],
    attachments: [
      { id: 1, name: 'current_docs.pdf', size: '2.4 MB', type: 'pdf' },
      { id: 2, name: 'compliance_req.png', size: '1.2 MB', type: 'image' },
    ],
    subtasks: [
      { id: 1, title: 'Review existing documentation', completed: true },
      { id: 2, title: 'Update compliance section', completed: true },
      { id: 3, title: 'Add new onboarding steps', completed: false },
      { id: 4, title: 'Review with legal team', completed: false },
    ],
  },
  {
    id: 2,
    title: 'Conduct quarterly performance review meetings',
    description:
      'Schedule and conduct performance review meetings with all team members for Q1 2024.',
    assignee: {
      name: 'Priya Patel',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
      department: 'Operations',
    },
    status: 'Completed',
    statusColor: 'bg-emerald-100 text-emerald-700',
    priority: 'Medium',
    priorityColor: 'bg-orange-100 text-orange-700',
    dueDate: '2024-01-12',
    dueIn: 'Completed',
    progress: 100,
    tags: ['HR', 'Reviews'],
    created: '2024-01-05',
  },
  {
    id: 3,
    title: 'Implement new payment gateway integration',
    description:
      'Integrate new payment gateway provider and test all payment flows across the platform.',
    assignee: {
      name: 'David Kim',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      department: 'Engineering',
    },
    status: 'Overdue',
    statusColor: 'bg-red-100 text-red-700',
    priority: 'High',
    priorityColor: 'bg-red-100 text-red-700',
    dueDate: '2024-01-08',
    dueIn: '5 days ago',
    progress: 40,
    tags: ['Engineering', 'Integration'],
    created: '2024-01-01',
  },
  {
    id: 4,
    title: 'Prepare monthly sales report',
    description:
      'Compile and analyze sales data for December 2023 and prepare comprehensive report for management.',
    assignee: {
      name: 'Maria Garcia',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
      department: 'Sales',
    },
    status: 'Pending',
    statusColor: 'bg-gray-100 text-gray-700',
    priority: 'Low',
    priorityColor: 'bg-gray-100 text-gray-700',
    dueDate: '2024-01-20',
    dueIn: '7 days',
    progress: 0,
    tags: ['Reports', 'Sales'],
    created: '2024-01-11',
  },
  {
    id: 5,
    title: 'Update company website content',
    description:
      'Review and update key pages on the company website with latest product information and features.',
    assignee: {
      name: 'Michael Tan',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      department: 'Marketing',
    },
    status: 'In Progress',
    statusColor: 'bg-blue-100 text-blue-700',
    priority: 'Medium',
    priorityColor: 'bg-orange-100 text-orange-700',
    dueDate: '2024-01-18',
    dueIn: '5 days',
    progress: 30,
    tags: ['Marketing', 'Website'],
    created: '2024-01-09',
  },
];

const summaryMetrics = [
  {
    label: 'Total Tasks',
    value: '148',
    detail: '+12 from last week',
    icon: Clock,
    color: 'text-primary',
  },
  {
    label: 'In Progress',
    value: '64',
    detail: '43% of total tasks',
    icon: Clock,
    color: 'text-blue-600',
  },
  {
    label: 'Completed',
    value: '92',
    detail: '62% completion rate',
    icon: CheckCircle2,
    color: 'text-emerald-600',
  },
  {
    label: 'Overdue',
    value: '26',
    detail: 'Needs attention',
    icon: AlertCircle,
    color: 'text-red-600',
  },
];

export default function TaskManagementPage() {
  const [taskList, setTaskList] = useState<Task[]>(
    initialTasks.map((task) => ({
      ...task,
      originalStatus: task.status,
      originalStatusColor: task.statusColor,
    }))
  );
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
    tags: [],
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

  const organizations = [
    'All',
    'Sales',
    'Support',
    'Operations',
    'Engineering',
    'Marketing',
    'HR',
  ];
  const assignees: Assignee[] = [
    {
      name: 'Sarah Lee',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      department: 'Sales',
    },
    {
      name: 'Priya Patel',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
      department: 'Operations',
    },
    {
      name: 'David Kim',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      department: 'Engineering',
    },
    {
      name: 'Maria Garcia',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
      department: 'Sales',
    },
    {
      name: 'Michael Tan',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      department: 'Marketing',
    },
  ];
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

  const toggleTaskCompletion = (taskId: number) => {
    setTaskList((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const isCompleted = task.status === 'Completed';
        const nextStatus = isCompleted
          ? (task.originalStatus ?? 'Pending')
          : 'Completed';
        const nextStatusColor = isCompleted
          ? (task.originalStatusColor ?? 'bg-gray-100 text-gray-700')
          : 'bg-emerald-100 text-emerald-700';
        const nextProgress =
          !isCompleted && typeof task.progress === 'number'
            ? 100
            : task.progress;

        return {
          ...task,
          status: nextStatus,
          statusColor: nextStatusColor,
          progress: nextProgress,
        };
      })
    );
  };

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
          <button className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>
          <button className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
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
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedStatus === status
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
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedPriority === priority
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
          {filteredTasks.map((task) => (
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
                          setSelectedTaskId(task.id);
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
          ))}
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
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage * recordsPerPage >= filteredTasks.length}
                className="flex items-center gap-1 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No tasks found matching your filters.
            </p>
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
                    tags: [],
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
                    Organization *
                  </label>
                  <select
                    value={newTask.organization}
                    onChange={(e) =>
                      setNewTask({ ...newTask, organization: e.target.value })
                    }
                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select organization</option>
                    {organizations
                      .filter((org) => org !== 'All')
                      .map((org) => (
                        <option key={org} value={org}>
                          {org}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Assignee *
                  </label>
                  <select
                    value={newTask.assignee}
                    onChange={(e) =>
                      setNewTask({ ...newTask, assignee: e.target.value })
                    }
                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select assignee</option>
                    {assignees.map((assignee) => (
                      <option key={assignee.name} value={assignee.name}>
                        {assignee.name} ({assignee.department})
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
                <select
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
                    e.target.value = '';
                  }}
                  className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Add a tag</option>
                  {availableTags
                    .filter((tag) => !newTask.tags.includes(tag))
                    .map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                </select>
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
                    tags: [],
                  });
                }}
                className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                Cancel
              </button>
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
                    tags: [],
                  });
                }}
                className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
              >
                Create Task
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
              <div>
                <h4 className="mb-2 text-xs font-medium text-gray-700">
                  Description
                </h4>
                <p className="text-sm leading-relaxed text-gray-800">
                  {selectedTask.description}
                </p>
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
                      src={selectedTask.assignee.avatar}
                      alt="You"
                      className="h-8 w-8 flex-shrink-0 rounded-full ring-2 ring-white"
                    />
                    <div className="flex-1">
                      <textarea
                        placeholder="Add a comment..."
                        rows={2}
                        className="w-full resize-none rounded-lg border border-border/40 bg-white px-3 py-2 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                      />
                      <button className="mt-2 text-xs font-medium text-primary hover:text-primary/80">
                        Post comment
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
                        <span className="font-medium">System Admin</span>
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
            <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border/40 p-4">
              <button
                onClick={() => setSelectedTaskId(null)}
                className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                Close
              </button>
              <button
                onClick={() => setSelectedTaskId(null)}
                className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
