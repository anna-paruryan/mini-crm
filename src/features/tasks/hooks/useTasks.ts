// features/tasks/hooks/useTasks.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase/client';
import type {
    CreateTaskInput,
    Executor,
    Task,
    TaskInput,
    HistoryItem,
} from '../model/types';

const TASK_SELECT = `
    *,
    object:objects(id, name),
    assignee:profiles!tasks_assignee_id_fkey(id, full_name),
    author:profiles!tasks_author_id_fkey(id, full_name)
`;

export const useTasksByObject = (objectId: string) =>
    useQuery<Task[]>({
        queryKey: ['tasks', 'object', objectId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select(TASK_SELECT)
                .eq('object_id', objectId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data ?? []) as Task[];
        },
        enabled: !!objectId,
    });

export const useMyTasks = (userId: string | undefined) =>
    useQuery<Task[]>({
        queryKey: ['tasks', 'mine', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select(TASK_SELECT)
                .eq('assignee_id', userId!)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data ?? []) as Task[];
        },
        enabled: !!userId,
    });

export const useTask = (taskId: string) =>
    useQuery<Task>({
        queryKey: ['task', taskId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select(TASK_SELECT)
                .eq('id', taskId)
                .maybeSingle();

            if (error) throw error;
            if (!data) {
                throw new Error('Task not found or you do not have access to it.');
            }
            return data as Task;
        },
        enabled: !!taskId,
        retry: false,
    });

export const useTaskHistory = (taskId: string) =>
    useQuery<HistoryItem[]>({
        queryKey: ['task-history', taskId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('task_history')
                .select('*, author:profiles!task_history_changed_by_fkey(full_name)')
                .eq('task_id', taskId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data ?? []) as HistoryItem[];
        },
        enabled: !!taskId,
    });

export const useExecutors = () =>
    useQuery<Executor[]>({
        queryKey: ['executors'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('role', 'executor')
                .order('full_name');

            if (error) throw error;
            return data ?? [];
        },
        staleTime: 5 * 60_000,
    });

function useInvalidateTasks() {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['task'] });
        queryClient.invalidateQueries({ queryKey: ['task-history'] });
    };
}

// Supabase выбрасывает PostgrestError (не instanceof Error), поэтому читаем только message
const onError = (error: { message?: string }) => {
    toast.error(error.message || 'Request failed');
};

async function createTask(input: CreateTaskInput): Promise<Task> {
    const { data, error } = await supabase
        .from('tasks')
        .insert({
            title: input.title,
            description: input.description,
            object_id: input.object_id,
            assignee_id: input.assignee_id,
        })
        .select()
        .single();

    if (error) throw error;
    return data as Task;
}

async function updateTask(id: string, input: TaskInput): Promise<Task> {
    const { data, error } = await supabase
        .from('tasks')
        .update({
            title: input.title,
            description: input.description,
            assignee_id: input.assignee_id,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Task;
}

async function deleteTask(id: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
}

export function useCreateTask() {
    const invalidate = useInvalidateTasks();

    return useMutation({
        mutationFn: createTask,
        onSuccess: () => {
            toast.success('Task created');
            invalidate();
        },
        onError,
    });
}

export function useUpdateTask() {
    const invalidate = useInvalidateTasks();

    return useMutation({
        mutationFn: (values: { id: string; input: TaskInput }) =>
            updateTask(values.id, values.input),
        onSuccess: () => {
            toast.success('Task updated');
            invalidate();
        },
        onError,
    });
}

export function useDeleteTask() {
    const invalidate = useInvalidateTasks();

    return useMutation({
        mutationFn: deleteTask,
        onSuccess: () => {
            toast.success('Task deleted');
            invalidate();
        },
        onError,
    });
}

// Смена статуса: см. hooks/useChangeTaskStatus.ts (вызывает RPC change_task_status)