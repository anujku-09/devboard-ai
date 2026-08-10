import { useCallback, useState } from "react";
import { suggestNextTask } from "../services/aiService";
import type { AiTaskSuggestion } from "../types/ai";
import type { Task } from "../types/task";

export function useTaskSuggestion() {
    const [suggestion, setSuggestion] = useState<AiTaskSuggestion | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getSuggestion = useCallback(
        async (tasks: Task[], projectName: string, recentCommitMessages: string[] = [], forceRefresh: boolean = false) => {
            setLoading(true);
            setError(null);

            try {
                const result = await suggestNextTask(tasks, projectName, recentCommitMessages, forceRefresh);
                setSuggestion(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to get AI task suggestion.");
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const reset = useCallback(() => {
        setSuggestion(null);
        setError(null);
    }, []);

    return { suggestion, loading, error, getSuggestion, reset };
}
