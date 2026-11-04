
import { ClipboardList, RefreshCw } from 'lucide-react';

import { useAuth } from '../../auth/hooks/useAuth';
import { useMyTasks } from '../hooks/useTasks';
import { TaskList } from '../components/TaskList';

export default function MyTasksPage() {
    const { profile } = useAuth();

    const {
        data: tasks = [],
        isLoading,
        isError,
        error,
        refetch,
    } = useMyTasks(profile?.id);

    return (
        <div className="min-h-full bg-slate-50 p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-8">

                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        My Tasks
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        View and manage the tasks assigned to you.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                                <ClipboardList size={22} />
                            </div>

                            <div>
                                <p className="text-sm text-slate-500">Total tasks</p>
                                <p className="text-2xl font-semibold text-slate-900">
                                    {tasks.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">In progress</p>
                        <p className="mt-2 text-2xl font-semibold text-blue-600">
                            {tasks.filter((task) => task.status === 'in_progress').length}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">Waiting for review</p>
                        <p className="mt-2 text-2xl font-semibold text-amber-600">
                            {tasks.filter((task) => task.status === 'in_review').length}
                        </p>
                    </div>

                </div>

                <section>
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Assigned to me
                        </h2>

                        <span className="text-sm text-slate-500">
              {tasks.length} tasks
            </span>
                    </div>

                    {isLoading && (
                        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                            Loading your tasks...
                        </div>
                    )}

                    {isError && (
                        <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
                            <p className="text-sm text-red-600">
                                {error instanceof Error
                                    ? error.message
                                    : 'Failed to load your tasks.'}
                            </p>

                            <button
                                type="button"
                                onClick={() => refetch()}
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                <RefreshCw size={16} />
                                Try again
                            </button>
                        </div>
                    )}

                    {!isLoading && !isError && (
                        <TaskList tasks={tasks} showObject />
                    )}
                </section>

            </div>
        </div>
    );
}
