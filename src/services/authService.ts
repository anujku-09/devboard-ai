import { supabase } from "../lib/supabase";

export async function login(
    email: string,
    password: string
) {
    const { error } =
        await supabase.auth.signInWithPassword({
            email,
            password,
        });

    if (error) throw error;
}

export async function signUp(
    email: string,
    password: string,
    username: string
): Promise<{ requiresEmailConfirmation: boolean }> {

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { username },
        },
    });

    if (error) throw error;

    // If Supabase returns a session immediately, email confirmation is
    // disabled on this project and the user is already signed in.
    // Otherwise they'll need to confirm their email before logging in.
    return { requiresEmailConfirmation: !data.session };
}

export async function logout() {
    const { error } =
        await supabase.auth.signOut();

    if (error) throw error;
}

export async function updateUsername(username: string) {
    const { data, error } = await supabase.auth.updateUser({
        data: { username },
    });

    if (error) throw error;

    return data.user;
}

export async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) throw error;
}

export async function getCurrentUser() {

    const {
        data: { user },
    } = await supabase.auth.getUser();

    return user;
}

export async function sendPasswordResetEmail(
    email: string
) {
    const { error } =
        await supabase.auth.resetPasswordForEmail(
            email,
            {
                redirectTo:
                    `${window.location.origin}/reset-password`,
            }
        );
    if (error) {
        throw error;
    }
}