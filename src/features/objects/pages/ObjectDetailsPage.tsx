import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    MapPin,
    Plus,
    ClipboardList,
    RefreshCw,
} from 'lucide-react';

import { supabase } from '../../../lib/supabase/client';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTasksByObject } from '../../tasks/hooks/useTasks';
import { TaskFormModal } from '../../tasks/components/TaskFormModal';
import { TaskStatusBadge } from '../../tasks/components/TaskStatusBadge';

interface ConstructionObject {
    id: string;
    name: string;
    address: string;
}

export default function ObjectDetailsPage() {
    const { objectId } = useParams<{ objectId: string }>();
    const { profile } = useAuth();
    const isManager = profile?.role === 'manager';
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {
        data: object,
        isLoading: isObjectLoading,
        isError: isObjectError,
        error: objectError,
        refetch: refetchObject,
    } = useQuery<ConstructionObject>({
        queryKey: ['object', objectId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('objects')
                .select('id, name, address')
                .eq('id', objectId!)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!objectId,
    });

    const {
        data: tasks = [],
        isLoading: isTasksLoading,
        isError: isTasksError,
        error: tasksError,
        refetch: refetchTasks,
    } = useTasksByObject(objectId ?? '');

    if (isObjectLoading) {
        return (
            <div className="p-8 text-center text-slate-500">
                Loading construction site...
            </div>
        );
    }

    if (isObjectError || !object) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-600">
                    {(objectError as { message?: string } | null)?.message ??
                        'Construction site not found.'}
                </p>

                <button
                    onClick={() => refetchObject()}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-slate-50 p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-8">

                <Link
                    to="/objects"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
                >
                    <ArrowLeft size={18} />
                    Back to Construction Sites
                </Link>

                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                                    <MapPin size={24} />
                                </div>

                                <span className="text-sm font-medium text-blue-600">
                                    Construction Site
                                </span>
                            </div>

                            <h1 className="mt-5 text-2xl font-bold text-slate-900">
                                {object.name}
                            </h1>

                            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                                <MapPin size={17} />
                                {object.address}
                            </p>
                        </div>

                        {isManager && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                            >
                                <Plus size={18} />
                                Create Task
                            </button>
                        )}
                    </div>
                </section>

                <section>
                    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">
                                Tasks
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {isManager
                                    ? 'All tasks of this construction site.'
                                    : 'Your tasks at this construction site.'}
                            </p>
                        </div>

                        <span className="text-sm text-slate-500">
                            {tasks.length} tasks
                        </span>
                    </div>

                    {isTasksLoading && (
                        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                            Loading tasks...
                        </div>
                    )}

                    {isTasksError && (
                        <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
                            <p className="text-sm text-red-600">
                                {(tasksError as { message?: string } | null)?.message ??
                                    'Failed to load tasks.'}
                            </p>

                            <button
                                onClick={() => refetchTasks()}
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                            >
                                <RefreshCw size={16} />
                                Try again
                            </button>
                        </div>
                    )}

                    {!isTasksLoading && !isTasksError && tasks.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                            <ClipboardList
                                size={40}
                                className="mx-auto text-slate-400"
                            />

                            <h3 className="mt-4 font-semibold text-slate-900">
                                No tasks yet
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                {isManager
                                    ? 'Create the first task for this construction site.'
                                    : 'No tasks are assigned to you at this construction site.'}
                            </p>

                            {isManager && (
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    <Plus size={18} />
                                    Create Task
                                </button>
                            )}
                        </div>
                    )}

                    {!isTasksLoading && !isTasksError && tasks.length > 0 && (
                        <div className="space-y-3">
                            {tasks.map((task) => (
                                <Link
                                    key={task.id}
                                    to={`/tasks/${task.id}`}
                                    className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                                >
                                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                                        <div>
                                            <h3 className="font-semibold text-slate-900 hover:text-blue-600">
                                                {task.title}
                                            </h3>

                                            {task.description && (
                                                <p className="mt-2 text-sm text-slate-500">
                                                    {task.description}
                                                </p>
                                            )}

                                            <p className="mt-3 text-sm text-slate-500">
                                                Assignee: {task.assignee?.full_name ?? 'Unassigned'}
                                            </p>
                                        </div>

                                        <TaskStatusBadge status={task.status} />
                                    </div>

                                    <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
                                        Created: {new Date(task.created_at).toLocaleDateString()}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {isManager && isModalOpen && (
                <TaskFormModal
                    objectId={object.id}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}