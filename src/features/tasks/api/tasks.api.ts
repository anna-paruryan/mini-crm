
// features/tasks/api/tasks.api.ts
import { supabase } from '../../../lib/supabase/client.ts';
import type { TaskStatus } from '../model/transitions';
import type { Executor, Task } from '../model/types.ts';

const TASK_SELECT = `
    *,
    object:objects(id, name),
    assignee:profiles!tasks_assignee_id_fkey(id, full_name),
    author:profiles!tasks_author_id_fkey(id, full_name)
`;

export async function getTasksByObject(objectId: string): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('object_id', objectId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Task[];
}

export async function getMyTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('assignee_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Task[];
}

export async function getTask(taskId: string): Promise<Task> {
    const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('id', taskId)
        .single();

    if (error) throw error;
    return data as Task;
}

export async function getTaskHistory(taskId: string) {
    const { data, error } = await supabase
        .from('task_history')
        .select('*, author:profiles!task_history_changed_by_fkey(full_name)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function getExecutors(): Promise<Executor[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'executor')
        .order('full_name');

    if (error) throw error;
    return (data ?? []) as Executor[];
}

export async function changeTaskStatus(p: {
    taskId: string;
    to: TaskStatus;
    comment?: string;
}) {
    const { error } = await supabase.rpc('change_task_status', {
        p_task_id: p.taskId,
        p_new_status: p.to,
        p_comment: p.comment?.trim() || null,
    });

    if (error) throw error;
}