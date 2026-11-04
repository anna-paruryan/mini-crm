// features/auth/pages/RequireRole.tsx
import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '../../tasks/model/transitions';
import { useAuth } from '../hooks/useAuth';

export function RequireRole({ role }: { role: Role }) {
    const { profile } = useAuth();
    if (profile?.role !== role) return <Navigate to="/" replace />;
    return <Outlet />;
}