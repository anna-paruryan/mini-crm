// features/tasks/components/TaskStatusBadge.tsx
import { STATUS_LABEL, type TaskStatus } from '../model/transitions';

const COLORS: Record<TaskStatus, string> = {
    new: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-blue-100 text-blue-700',
    in_review: 'bg-amber-100 text-amber-800',
    accepted: 'bg-green-100 text-green-700',
    rework: 'bg-red-100 text-red-700',
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
    return (
        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[status]}`}>
            {STATUS_LABEL[status]}
        </span>
    );
}