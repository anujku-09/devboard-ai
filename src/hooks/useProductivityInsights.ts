import { useCallback, useState } from "react";
import { generateProductivityInsights } from "../services/aiService";
import type { AiProductivityInsight } from "../types/ai";
import type { Project } from "../types/project";
import type { Task } from "../types/task";

export function useProductivityInsights() {
    const [insight, setInsight] = useState<AiProductivityInsight | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = useCallback(
        async (tasks: Task[], projects: Project[], githubUsername?: string | null, forceRefresh: boolean = false) => {
            setLoading(true);
            setError(null);

            try {
                const result = await generateProductivityInsights(tasks, projects, githubUsername, forceRefresh);
                setInsight(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to generate productivity insights.");
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const reset = useCallback(() => {
        setInsight(null);
        setError(null);
    }, []);

    return { insight, loading, error, generate, reset };
}
