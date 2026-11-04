// features/auth/pages/LoginPage.tsx
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    Eye,
    EyeOff,
    Loader2,
    Lock,
    Mail,
} from 'lucide-react';

import { signIn } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

const FEATURES = [
    'Manage construction sites in one place',
    'Assign tasks and track every status change',
    'Review and accept completed work',
];

export function LoginPage() {
    const { session, loading } = useAuth();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Already signed in (or just signed in) -> go where the user wanted to go
    if (!loading && session) {
        const from =
            (location.state as { from?: { pathname: string } } | null)?.from
                ?.pathname ?? '/objects';
        return <Navigate to={from} replace />;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await signIn(email.trim(), password);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Unable to sign in. Please try again.',
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="grid min-h-screen lg:grid-cols-2">
            {/* Brand panel */}
            <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-12 text-white lg:flex">
                <div
                    aria-hidden
                    className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl"
                />
                <div
                    aria-hidden
                    className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"
                />

                <div className="relative flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-semibold">Mini CRM</span>
                </div>

                <div className="relative space-y-8">
                    <h2 className="max-w-md text-4xl font-semibold leading-tight">
                        Keep every construction site on track.
                    </h2>
                    <ul className="space-y-4">
                        {FEATURES.map((feature) => (
                            <li key={feature} className="flex items-center gap-3 text-slate-300">
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-400" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative text-sm text-slate-500">
                    © {new Date().getFullYear()} Mini CRM
                </p>
            </section>

            {/* Form panel */}
            <section className="flex items-center justify-center bg-slate-50 px-6 py-12">
                <div className="w-full max-w-sm">
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-semibold text-slate-900">Mini CRM</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                            Welcome back
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Sign in to your account to continue
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    aria-pressed={showPassword}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                            >
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !email || !password}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-slate-400">
                        Access is by invitation only. Contact your administrator for an account.
                    </p>
                </div>
            </section>
        </main>
    );
}