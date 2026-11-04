
import { useTaskHistory } from '../hooks/useTasks';
import { STATUS_LABEL } from '../model/transitions';
import { Empty, ErrorBox, Loading } from '../../../components/ui/QueryState';
import { formatDate } from '../../../lib/format';
import type { HistoryItem } from '../model/types';

export function TaskHistory({ taskId }: { taskId: string }) {
    const { data, isLoading, error } = useTaskHistory(taskId);

    const history: HistoryItem[] = data ?? [];

    if (isLoading) return <Loading />;
    if (error) return <ErrorBox error={error} />;
    if (!history.length) {
        return <Empty text="No status changes yet" />;
    }

    return (
        <ol className="space-y-4 border-l-2 border-slate-200 pl-4">
            {history.map((h) => (
                <li key={h.id} className="relative">
                    <span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600" />

                    <p className="text-sm font-medium text-slate-900">
                        {h.from_status
                            ? `${STATUS_LABEL[h.from_status]} → `
                            : ''}
                        {STATUS_LABEL[h.to_status]}
                    </p>

                    <p className="text-xs text-slate-500">
                        {h.author?.full_name ?? 'Unknown'} · {formatDate(h.created_at)}
                    </p>

                    {h.comment && (
                        <p className="mt-1 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                            {h.comment}
                        </p>
                    )}
                </li>
            ))}
        </ol>
    );
}
