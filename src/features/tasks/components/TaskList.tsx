// features/tasks/components/TaskList.tsx
import { Link } from 'react-router-dom';

import type { Task } from '../model/types';
import { TaskStatusBadge } from './TaskStatusBadge';
import {formatDate} from "../../../lib/format.ts";
import {Empty} from "../../../components/ui/QueryState.tsx";

export function TaskList({ tasks, showObject = false }: { tasks: Task[]; showObject?: boolean }) {
    if (tasks.length === 0) return <Empty text="No tasks yet" />;

    return (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {tasks.map((t) => (
                <li key={t.id}>
                    <Link to={`/tasks/${t.id}`} className="flex flex-col gap-2 px-4 py-3 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{t.title}</p>
                            <p className="truncate text-xs text-slate-500">
                                {showObject && t.object ? `${t.object.name} · ` : ''}
                                {t.assignee?.full_name ?? 'Unassigned'} · {formatDate(t.created_at)}
                            </p>
                        </div>
                        <TaskStatusBadge status={t.status} />
                    </Link>
                </li>
            ))}
        </ul>
    );
}