import { useCallback, useState } from "react";
import { analyzeProjectHealth } from "../services/aiService";
import type { AiProjectHealth } from "../types/ai";
import type { Project } from "../types/project";
import type { Task } from "../types/task";

export function useProjectHealth() {
    const [health, setHealth] = useState<AiProjectHealth | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const analyze = useCallback(
        async (
            project: Project,
            tasks: Task[],
            repoConnected: boolean = false,
            forceRefresh: boolean = false,
            collaboratorsCount: number = 1,
            linkedGithubCount: number = 0
        ) => {
            setLoading(true);
            setError(null);

            try {
                const result = await analyzeProjectHealth(
                    project,
                    tasks,
                    repoConnected,
                    forceRefresh,
                    collaboratorsCount,
                    linkedGithubCount
                );
                setHealth(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to analyze project health.");
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const reset = useCallback(() => {
        setHealth(null);
        setError(null);
    }, []);

    return { health, loading, error, analyze, reset };
}
