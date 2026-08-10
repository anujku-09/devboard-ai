import { useCallback, useEffect, useState } from "react";

import { listCommits } from "../services/githubApiService";
import type { GithubCommit, RepositoryConnection } from "../types/github";

export function useGithubCommits(repo: RepositoryConnection | null) {
    const [commits, setCommits] = useState<GithubCommit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!repo) {
            setCommits([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await listCommits(repo.owner, repo.name, repo.defaultBranch);
            setCommits(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load commits.");
        } finally {
            setLoading(false);
        }
    }, [repo]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { commits, loading, error, refresh };
}