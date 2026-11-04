// components/layout/AppLayout.tsx
import { Suspense, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Building2, Menu } from 'lucide-react';

import { Sidebar } from './Sidebar';

function PageFallback() {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>;
}

export function AppLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Close drawer on Escape
    useEffect(() => {
        if (!isSidebarOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsSidebarOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isSidebarOpen]);

    // Lock page scroll while the drawer is open
    useEffect(() => {
        if (!isSidebarOpen) return;

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [isSidebarOpen]);

    return (
        <div className=" flex min-h-dvh bg-gray-50 lg:flex">
            {/* Mobile top bar */}
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
                <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Open menu"
                    aria-expanded={isSidebarOpen}
                    aria-controls="app-sidebar"
                    className="-ml-2 rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                    <Menu size={22} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                        <Building2 size={16} />
                    </div>
                    <span className="font-semibold text-slate-900">Mini CRM</span>
                </div>
            </header>

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <div className="mx-auto max-w-5xl">
                    <Suspense fallback={<PageFallback />}>
                        <Outlet />
                    </Suspense>
                </div>
            </main>
        </div>
    );
}