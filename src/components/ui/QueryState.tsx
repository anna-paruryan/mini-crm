// components/ui/QueryState.tsx
import { AlertCircle, Loader2 } from 'lucide-react';

export function Loading() {
    return (
        <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
            <Loader2 className="animate-spin" size={16} /> Loading…
        </div>
    );
}

export function ErrorBox({ error }: { error: unknown }) {
    const message = error instanceof Error ? error.message : 'Something went wrong';
    return (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" /> {message}
        </div>
    );
}

export function Empty({ text }: { text: string }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
            {text}
        </div>
    );
}