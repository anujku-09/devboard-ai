import { useCallback, useMemo, useState } from "react";
import { suggestNextTasksBatch, getCachedAiResponse } from "../services/aiService";
import type { AiNextTaskItem, AiTaskSuggestionBatch } from "../types/ai";
import type { Task } from "../types/task";

const EMPTY_TASKS: AiNextTaskItem[] = [];

export function useTaskSuggestion() {
    const [batch, setBatch] = useState<AiTaskSuggestionBatch | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getSuggestion = useCallback(
        async (
            tasks: Task[],
            projectName: string,
            recentCommitMessages: string[] = [],
            forceRefresh: boolean = false,
            collaboratorsCount: number = 1,
            projectDescription: string = "",
            repoConnected: boolean = false,
            projectId?: string
        ) => {
            const cacheKey = projectId ? `suggestion_${projectId}` : `suggestion_${projectName.replace(/\s+/g, "_")}`;

            // Check persistent localStorage cache first if not explicitly refreshing
            if (!forceRefresh) {
                const cached = getCachedAiResponse<AiTaskSuggestionBatch>(cacheKey);
                if (cached) {
                    setBatch(cached);
                    setError(null);
                    return cached;
                }
            }

            setLoading(true);
            setError(null);

            try {
                const result = await suggestNextTasksBatch(
                    tasks,
                    projectName,
                    recentCommitMessages,
                    forceRefresh,
                    collaboratorsCount,
                    projectDescription,
                    repoConnected,
                    projectId
                );
                setBatch(result);
                return result;
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to get AI task suggestions.");
                return null;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const reset = useCallback(() => {
        setBatch(null);
        setError(null);
    }, []);

    // For backwards compatibility with single-suggestion callers (memoized to avoid new references)
    const suggestion = useMemo(() => {
        const firstTask = batch?.tasks?.[0];
        if (!firstTask) return null;
        return {
            suggestedTaskId: firstTask.id,
            suggestedTaskTitle: firstTask.title,
            suggestedTaskDescription: firstTask.description,
            priority: firstTask.priority,
            isNewInferredTask: firstTask.isNewInferredTask,
            reasoning: firstTask.reasoning || batch?.summary || "",
            recommendedNextSteps: firstTask.recommendedNextSteps || [],
        };
    }, [batch]);

    const tasks = useMemo(() => {
        return batch?.tasks ?? EMPTY_TASKS;
    }, [batch]);

    return {
        batch,
        tasks,
        suggestion,
        loading,
        error,
        getSuggestion,
        reset,
    };
}
