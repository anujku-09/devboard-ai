import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import AuthContext from "./AuthContext";
import { supabase } from "../lib/supabase";

import {
    login,
    logout,
    signUp,
    getCurrentUser,
    updateUsername,
    updatePassword,
    sendPasswordResetEmail,
} from "../services/authService";

interface AuthProviderProps {
    children: React.ReactNode;
}

function AuthProvider({
    children,
}: AuthProviderProps) {

    const [user, setUser] =
        useState<User | null>(null);

    const [loading, setLoading] =
        useState(true);

    const isAuthenticated = !!user;

    useEffect(() => {
        let isMounted = true;

        async function initialize() {
            const currentUser =
                await getCurrentUser();
            if (isMounted) {
                setUser(currentUser);
                setLoading(false);
            }
        }

        initialize();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (isMounted) {
                    setUser(session?.user ?? null);
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const handleLogin = async (
        email: string,
        password: string
    ) => {

        await login(email, password);

        const currentUser =
            await getCurrentUser();

        setUser(currentUser);

    };

    const handleSignUp = async (
        email: string,
        password: string,
        username: string
    ) => {

        const result = await signUp(email, password, username);

        if (!result.requiresEmailConfirmation) {
            const currentUser =
                await getCurrentUser();

            setUser(currentUser);
        }

        return result;
    };

    const handleLogout = async () => {
        await logout();
        setUser(null);
    };

    const handleUpdateUsername = async (username: string) => {
        const updatedUser = await updateUsername(username);
        setUser(updatedUser);
    };

    const handleUpdatePassword = async (password: string) => {
        await updatePassword(password);
    };

    const handleSendPasswordResetEmail = async (email: string) => {
        await sendPasswordResetEmail(email);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated,
                login: handleLogin,
                signUp: handleSignUp,
                logout: handleLogout,
                updateUsername: handleUpdateUsername,
                updatePassword: handleUpdatePassword,
                sendPasswordResetEmail: handleSendPasswordResetEmail,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;