// features/tasks/hooks/useChangeTaskStatus.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { changeTaskStatus } from '../api/tasks.api';

export function useChangeTaskStatus(taskId: string) {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: changeTaskStatus,
        onSuccess: () => {
            toast.success('Status updated');

            qc.invalidateQueries({ queryKey: ['task', taskId] });
            qc.invalidateQueries({ queryKey: ['task-history', taskId] });
            qc.invalidateQueries({ queryKey: ['tasks'] });
        },
        onError: (e: Error) =>
            toast.error(e.message || 'Failed to update status'),
    });
}