// providers/AuthProvider.tsx
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase/client';
import { queryClient } from '../lib/queryClient';
import { AuthContext, type Profile } from '../features/tasks/model/auth.context.ts';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);

    // 1. Сессия
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setSessionLoading(false);
        });

        const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
            setSession(next); // внутри колбэка не делаем запросов к supabase
            if (event === 'SIGNED_OUT') queryClient.clear();
        });

        return () => sub.subscription.unsubscribe();
    }, []);

    // 2. Профиль (роль)
    const userId = session?.user.id;
    useEffect(() => {
        if (!userId) {
            setProfile(null);
            return;
        }

        let cancelled = false;
        setProfileLoading(true);

        supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('id', userId)
            .single()
            .then(({ data, error }) => {
                if (cancelled) return;
                setProfile(error ? null : (data as Profile));
                setProfileLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [userId]);

    const value = useMemo(
        () => ({
            session,
            user: session?.user ?? null,
            profile,
            loading: sessionLoading || profileLoading,
            signOut: async () => {
                await supabase.auth.signOut();
            },
        }),
        [session, profile, sessionLoading, profileLoading],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}