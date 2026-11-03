import { useCallback, useState } from "react";
import { generateProjectBreakdown, getCachedAiResponse } from "../services/aiService";
import type { AiSuggestedTask } from "../types/ai";

export function useProjectBreakdown() {
    const [tasks, setTasks] = useState<AiSuggestedTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = useCallback(async (projectName: string, projectDescription: string, forceRefresh: boolean = false) => {
        const cacheKey = `breakdown_${projectName.replace(/\s+/g, "_")}`;

        if (!forceRefresh) {
            const cached = getCachedAiResponse<AiSuggestedTask[]>(cacheKey);
            if (cached) {
                setTasks(cached);
                setError(null);
                return cached;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const result = await generateProjectBreakdown(projectName, projectDescription, forceRefresh);
            setTasks(result);
            return result;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate breakdown.");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setTasks([]);
        setError(null);
    }, []);

    return { tasks, loading, error, generate, reset };
}
