// features/tasks/model/types.ts
import type { TaskStatus } from './transitions';
export interface CreateTaskInput extends TaskInput {
    object_id: string;
}
export interface Task {
    id: string;
    title: string;
    description: string | null;
    object_id: string;
    assignee_id: string | null;
    author_id: string;
    status: TaskStatus;
    created_at: string;
    object: { id: string; name: string } | null;
    assignee: { id: string; full_name: string } | null;
    author: { id: string; full_name: string } | null;
}

export interface HistoryItem {
    id: string;
    task_id: string;
    from_status: TaskStatus | null;
    to_status: TaskStatus;
    comment: string | null;
    created_at: string;
    author: { full_name: string } | null;
}

export interface Executor {
    id: string;
    full_name: string;
}

export interface TaskInput {
    title: string;
    description: string | null;
    assignee_id: string | null;
}