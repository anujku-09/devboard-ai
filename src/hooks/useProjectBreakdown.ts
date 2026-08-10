import { useCallback, useState } from "react";
import { generateProjectBreakdown } from "../services/aiService";
import type { AiSuggestedTask } from "../types/ai";

export function useProjectBreakdown() {
    const [tasks, setTasks] = useState<AiSuggestedTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = useCallback(async (projectName: string, projectDescription: string, forceRefresh: boolean = false) => {
        setLoading(true);
        setError(null);

        try {
            const result = await generateProjectBreakdown(projectName, projectDescription, forceRefresh);
            setTasks(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate breakdown.");
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
