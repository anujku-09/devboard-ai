import type { User } from "@supabase/supabase-js";

export function getDisplayName(user: User | null): string {
    const username = user?.user_metadata?.username;

    if (typeof username === "string" && username.trim().length > 0) {
        return username;
    }

    return user?.email ?? "there";
}

export function getInitial(user: User | null): string {
    return getDisplayName(user).charAt(0).toUpperCase() || "U";
}
