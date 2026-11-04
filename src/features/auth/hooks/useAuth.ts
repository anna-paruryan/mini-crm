// features/auth/hooks/useAuth.ts
import { useContext } from 'react';
import {AuthContext} from "../../tasks/model/auth.context.ts";


export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}