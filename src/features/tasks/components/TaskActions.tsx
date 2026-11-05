// features/tasks/components/TaskActions.tsx
import { useState } from 'react';
import { useChangeTaskStatus } from '../hooks/useChangeTaskStatus';
import { getAvailableTransitions, type TaskStatus } from '../model/transitions';
import { useAuth } from '../../auth/hooks/useAuth';

interface Props {
    taskId: string;
    status: TaskStatus;
    assigneeId: string | null;
}

const base =
    'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60';
const primary = `${base} bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500/30`;
const danger = `${base} bg-red-600 hover:bg-red-700 focus-visible:ring-red-500/30`;

export function TaskActions({ taskId, status, assigneeId }: Props) {
    const { profile } = useAuth();
    const { mutate, isPending } = useChangeTaskStatus(taskId);
    const [pending, setPending] = useState<TaskStatus | null>(null);
    const [comment, setComment] = useState('');

    if (!profile) return null;

    const actions = getAvailableTransitions({
        status,
        assigneeId,
        userId: profile.id,
        role: profile.role,
    });

    if (actions.length === 0) {
        return (
            <p className="text-sm text-slate-500">
                No actions available for you at this status.
            </p>
        );
    }

    const needsComment = actions.find((a) => a.to === pending)?.commentRequired;

    const submit = (to: TaskStatus, c?: string) =>
        mutate(
            { taskId, to, comment: c },
            {
                onSuccess: () => {
                    setPending(null);
                    setComment('');
                },
            },
        );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {actions.map((a) => (
                    <button
                        key={a.to}
                        type="button"
                        disabled={isPending}
                        onClick={() => (a.commentRequired ? setPending(a.to) : submit(a.to))}
                        className={a.variant === 'danger' ? danger : primary}
                    >
                        {a.label}
                    </button>
                ))}
            </div>

            {needsComment && pending && (
                <div className="space-y-3">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="What needs to be reworked?"
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={isPending || comment.trim().length === 0}
                            onClick={() => submit(pending, comment)}
                            className={danger}
                        >
                            Confirm
                        </button>
                        <button
                            type="button"
                            onClick={() => setPending(null)}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}