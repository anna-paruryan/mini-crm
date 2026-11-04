//src/features/tasks/pages/TaskDetailsPage.tsx
import { Link, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    User,
} from 'lucide-react';

import { useTask } from '../hooks/useTasks';
import { TaskActions } from '../components/TaskActions';
import { TaskHistory } from '../components/TaskHistory';
import { TaskStatusBadge } from '../components/TaskStatusBadge';
import { formatDate } from '../../../lib/format';

export default function TaskDetailsPage() {
    const { taskId } = useParams<{ taskId: string }>();

    const {
        data: task,
        isLoading,
        isError,
        error,
        refetch,
    } = useTask(taskId ?? '');

    if (isLoading) {
        return (
            <div className="p-8 text-center text-slate-500">
                Loading task...
            </div>
        );
    }

    if (isError || !task) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-600">
                    {error instanceof Error ? error.message : 'Task not found.'}
                </p>

                <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-slate-50 p-6 lg:p-8">
            <div className="mx-auto max-w-5xl space-y-6">

                <Link
                    to={task.object ? `/objects/${task.object.id}` : '/my-tasks'}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
                >
                    <ArrowLeft size={18} />
                    Back
                </Link>

                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                            <p className="text-sm font-medium text-blue-600">
                                Task details
                            </p>

                            <h1 className="mt-2 text-2xl font-bold text-slate-900">
                                {task.title}
                            </h1>
                        </div>

                        <TaskStatusBadge status={task.status} />
                    </div>

                    {task.description && (
                        <div className="mt-6 border-t border-slate-100 pt-5">
                            <h2 className="text-sm font-semibold text-slate-700">
                                Description
                            </h2>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                {task.description}
                            </p>
                        </div>
                    )}

                    <div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2">

                        <div className="flex items-start gap-3">
                            <Building2 size={19} className="mt-0.5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">Construction site</p>
                                {task.object ? (
                                    <Link
                                        to={`/objects/${task.object.id}`}
                                        className="mt-1 text-sm font-medium text-blue-600 hover:underline"
                                    >
                                        {task.object.name}
                                    </Link>
                                ) : (
                                    <p className="mt-1 text-sm text-slate-700">Not available</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <User size={19} className="mt-0.5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">Assignee</p>
                                <p className="mt-1 text-sm font-medium text-slate-800">
                                    {task.assignee?.full_name ?? 'Unassigned'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <User size={19} className="mt-0.5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">Created by</p>
                                <p className="mt-1 text-sm font-medium text-slate-800">
                                    {task.author?.full_name ?? 'Unknown'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CalendarDays size={19} className="mt-0.5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500">Created at</p>
                                <p className="mt-1 text-sm font-medium text-slate-800">
                                    {formatDate(task.created_at)}
                                </p>
                            </div>
                        </div>

                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900">
                        Available actions
                    </h2>

                    <TaskActions
                        taskId={task.id}
                        status={task.status}
                        assigneeId={task.assignee_id}
                    />
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-5 text-lg font-semibold text-slate-900">
                        Task history
                    </h2>

                    <TaskHistory taskId={task.id} />
                </section>

            </div>
        </div>
    );
}
