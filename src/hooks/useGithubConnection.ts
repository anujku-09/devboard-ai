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
        setError(null);

        try {
            const existing = await getGithubConnection();
            setConnection(existing);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load GitHub connection.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    useEffect(() => {
        const unwatch = watchForGithubProviderToken((newConnection) => {
            setConnection(newConnection);
            setConnecting(false);
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