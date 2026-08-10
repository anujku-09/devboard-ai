import { useCallback, useEffect, useState } from "react";

import {
  connectRepository,
  disconnectRepository,
  getRepositoryConnection,
} from "../services/repositoryService";
import type { GithubRepo, RepositoryConnection } from "../types/github";

export function useRepositoryConnection(projectId: string | undefined) {
  const [connection, setConnection] = useState<RepositoryConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const existing = await getRepositoryConnection(projectId);
      setConnection(existing);
    } catch (err) {
      console.error("Failed to load repository connection:", err);
      setError(err instanceof Error ? err.message : "Failed to load repository connection.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connect = useCallback(
    async (repo: GithubRepo) => {
      if (!projectId) return;

      setError(null);
      try {
        const newConnection = await connectRepository(projectId, repo);
        setConnection(newConnection);
      } catch (err: any) {
        console.error("Failed to connect repository:", err);

        // Handle duplicate repo conflict (409)
        if (err?.code === "409" || err?.message?.includes("duplicate key")) {
          setError("This project already has a connected repository.");
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to connect repository.");
        }
      }
    },
    [projectId]
  );

  const disconnect = useCallback(async () => {
    if (!projectId) return;

    setError(null);

    try {
      await disconnectRepository(projectId);
      setConnection(null);
    } catch (err) {
      console.error("Failed to disconnect repository:", err);
      setError(err instanceof Error ? err.message : "Failed to disconnect repository.");
    }
  }, [projectId]);

  return {
    connection,
    loading,
    error,
    connect,
    disconnect,
  };
}
