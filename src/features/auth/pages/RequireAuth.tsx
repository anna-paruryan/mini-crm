// features/auth/pages/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import {useAuth} from "../hooks/useAuth.ts";



export function RequireAuth() {
    const { session, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div className="p-6">Loading…</div>;
    if (!session) return <Navigate to="/login" replace state={{ from: location }} />;
    return <Outlet />;
}