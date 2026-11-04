// features/tasks/components/TaskActions.tsx
import { useState } from 'react';
import { useChangeTaskStatus } from '../hooks/useChangeTaskStatus';
import { getAvailableTransitions, type TaskStatus } from '../model/transitions';
import {useAuth} from "../../auth/hooks/useAuth.ts";


interface Props {
    taskId: string;
    status: TaskStatus;
    assigneeId: string | null;
}

export function TaskActions({ taskId, status, assigneeId }: Props) {
    const { profile } = useAuth();
    const { mutate, isPending } = useChangeTaskStatus(taskId);
    const [pending, setPending] = useState<TaskStatus | null>(null);
    const [comment, setComment] = useState('');

    if (!profile) return null;
    const actions = getAvailableTransitions({
        status, assigneeId, userId: profile.id, role: profile.role,
    });
    if (actions.length === 0) return null;

    const needsComment = actions.find((a) => a.to === pending)?.commentRequired;

    const submit = (to: TaskStatus, c?: string) =>
        mutate({ taskId, to, comment: c }, { onSuccess: () => { setPending(null); setComment(''); } });

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {actions.map((a) => (
                    <button
                        key={a.to}
                        disabled={isPending}
                        onClick={() => (a.commentRequired ? setPending(a.to) : submit(a.to))}
                        className={a.variant === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
                    >
                        {a.label}
                    </button>
                ))}
            </div>

            {needsComment && pending && (
                <div className="space-y-2">
          <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Что нужно доработать?"
              className="w-full rounded border p-2"
              rows={3}
          />
                    <div className="flex gap-2">
                        <button
                            disabled={isPending || comment.trim().length === 0}
                            onClick={() => submit(pending, comment)}
                            className="btn btn-danger"
                        >
                            Подтвердить
                        </button>
                        <button onClick={() => setPending(null)} className="btn">Отмена</button>
                    </div>
                </div>
            )}
        </div>
    );
}