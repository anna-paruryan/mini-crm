// components/layout/Sidebar.tsx
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Building2,
    ClipboardList,
    Loader2,
    LogOut,
    X,
    type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { signOut } from '../../features/auth/api/auth';
import { useAuth } from '../../features/auth/hooks/useAuth';

interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
}

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const MANAGER_NAV: NavItem[] = [
    { label: 'Construction Sites', path: '/objects', icon: Building2 },
];

const EXECUTOR_NAV: NavItem[] = [
    { label: 'My Tasks', path: '/my-tasks', icon: ClipboardList },
    { label: 'Construction Sites', path: '/objects', icon: Building2 },
];

function getInitials(name?: string | null) {
    if (!name) return 'U';
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { profile } = useAuth();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const isManager = profile?.role === 'manager';
    const navItems = isManager ? MANAGER_NAV : EXECUTOR_NAV;

    async function handleSignOut() {
        setIsSigningOut(true);
        try {
            await signOut();
            toast.success('You have successfully signed out');
            // RequireAuth redirects to /login as soon as the session disappears
        } catch {
            toast.error('Failed to sign out');
            setIsSigningOut(false);
        }
    }

    return (
        <>
            {/* Overlay (mobile only) */}
            <div
                aria-hidden
                onClick={onClose}
                className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
                    isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
            />

            <aside
                id="app-sidebar"
                className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-slate-900 text-white shadow-xl transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:w-64 lg:max-w-none lg:translate-x-0 lg:shadow-none ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Brand */}
                <div className="flex items-center justify-between border-b border-slate-700 px-5 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
                            <Building2 size={18} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-tight tracking-tight">
                                Mini CRM
                            </h1>
                            <p className="text-xs text-slate-400">
                                Construction Management
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close menu"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
                    {navItems.map(({ label, path, icon: Icon }) => (
                        <NavLink
                            key={path}
                            to={path}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                                    isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            <Icon size={19} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* User block */}
                <div className="border-t border-slate-700 p-4">
                    <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold">
                            {getInitials(profile?.full_name)}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                                {profile?.full_name || 'User'}
                            </p>
                            <p className="text-xs text-slate-400">
                                {isManager ? 'Manager' : 'Executor'}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-60"
                    >
                        {isSigningOut ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <LogOut size={18} />
                        )}
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}