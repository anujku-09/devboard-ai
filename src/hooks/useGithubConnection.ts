import { useCallback, useEffect, useState } from "react";

import {
    connectGithub,
    disconnectGithub,
    getGithubConnection,
    watchForGithubProviderToken,
} from "../services/githubService";
import type { GithubConnection } from "../types/github";

export function useGithubConnection() {
    const [connection, setConnection] = useState<GithubConnection | null>(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);

        try {
            const existing = await getGithubConnection();
            setConnection(existing);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load GitHub connection.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Check URL parameters for OAuth errors (e.g. identity_already_exists)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const errorCode = params.get("error_code");
        const errorDesc = params.get("error_description");
        const errorParam = params.get("error");

        if (errorCode || errorParam) {
            if (errorCode === "identity_already_exists") {
                setError(
                    "This GitHub account is already linked to another DevBoard AI user account. Please log into that account in Supabase to unlink it, or use a different GitHub account."
                );
            } else {
                setError(errorDesc || errorParam || "Failed to link GitHub account.");
            }
            // Clean URL query string
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    useEffect(() => {
        const unwatch = watchForGithubProviderToken((newConnection) => {
            setConnection(newConnection);
            setConnecting(false);
            setError(null);
        });

        return unwatch;
    }, []);

    const connect = useCallback(async () => {
        setConnecting(true);
        setError(null);

        try {
            await connectGithub();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to start GitHub connection.");
            setConnecting(false);
        }
    }, []);

    const disconnect = useCallback(async () => {
        setError(null);

        try {
            await disconnectGithub();
            setConnection(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to disconnect GitHub.");
        }
    }, []);

    return {
        connection,
        loading,
        connecting,
        error,
        connect,
        disconnect,
    };
}
