import { useCallback, useState } from "react";
import { analyzeProjectHealth, getCachedAiResponse } from "../services/aiService";
import { addWorkspaceNotification } from "../services/notificationService";
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
            const cacheKey = `health_${project.id}`;

            if (!forceRefresh) {
                const cached = getCachedAiResponse<AiProjectHealth>(cacheKey);
                if (cached) {
                    setHealth(cached);
                    setError(null);
                    return cached;
                }
            }

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
                if (project.user_id && forceRefresh) {
                    addWorkspaceNotification(project.user_id, {
                        title: "Project Health Diagnostic",
                        message: `AI Health evaluated at ${result.healthScore}/100 (${result.status}) for ${project.name}.`,
                        type: "success",
                    });
                }
                return result;
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to analyze project health.");
                return null;
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
