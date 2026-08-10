import { useCallback, useEffect, useState } from "react";

import { listPullRequests } from "../services/githubApiService";
import type { GithubPullRequest, RepositoryConnection } from "../types/github";

export function useGithubPullRequests(repo: RepositoryConnection | null) {
    const [pullRequests, setPullRequests] = useState<GithubPullRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!repo) {
            setPullRequests([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await listPullRequests(repo.owner, repo.name);
            setPullRequests(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load pull requests.");
        } finally {
            setLoading(false);
        }
    }, [repo]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { pullRequests, loading, error, refresh };
}