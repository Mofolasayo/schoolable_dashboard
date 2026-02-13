export type Task = {
  id: number;
  title: string;
  description: string;
  assignee: {
    id?: string;
    name: string;
    avatar: string;
    department: string;
  };
  assignees?: {
    id?: string;
    name: string;
    avatar: string;
    department: string;
    role?: string;
  }[];
  creator?: {
    id?: string;
    name: string;
    avatar: string;
  };
  organization: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
  dueDate: string;
  tags: string[];
  progress: number;
  subtasks: { id?: number; title: string; completed: boolean }[];
  attachments: {
    id: number;
    name: string;
    size: string;
    type: string;
    url: string;
  }[];
  comments: {
    id: number;
    author: string;
    avatar: string;
    text: string;
    timestamp: string;
  }[];
  created: string;
};

export type CreateTaskData = {
  title: string;
  description: string;
  assignee: string; // User ID (UUID)
  assigneeIds?: string[];
  organization: string; // Department name
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string;
  dueTime?: string;
  tags: string[];
  subtasks: { title: string }[];
  attachments: (
    | File
    | { name: string; size: number; type: string; url: string; path: string }
  )[];
  recurringTemplateId?: string;
  isRecurringInstance?: boolean;
};
