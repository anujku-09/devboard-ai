import { createContext } from "react";
import type { User } from "@supabase/supabase-js";

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;

    login: (
        email: string,
        password: string
    ) => Promise<void>;

    signUp: (
        email: string,
        password: string,
        username: string
    ) => Promise<{ requiresEmailConfirmation: boolean }>;

    logout: () => Promise<void>;

    updateUsername: (username: string) => Promise<void>;

    updatePassword: (password: string) => Promise<void>;
    sendPasswordResetEmail:(email:string)=> Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export default AuthContext;