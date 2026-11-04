// features/auth/model/auth.context.ts
import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type {Role} from "./transitions.ts";


export interface Profile {
    id: string;
    full_name: string;
    role: Role;
}

export interface AuthContextValue {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);