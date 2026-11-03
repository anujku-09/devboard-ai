import { useCallback, useState, useEffect } from "react";
import { generateProductivityInsights, getCachedAiResponse } from "../services/aiService";
import type { AiProductivityInsight } from "../types/ai";
import type { Project } from "../types/project";
import type { Task } from "../types/task";

export function useProductivityInsights() {
    const [insight, setInsight] = useState<AiProductivityInsight | null>(() => {
        return getCachedAiResponse<AiProductivityInsight>("productivity");
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial check from localStorage cache (0 API tokens used)
    useEffect(() => {
        const cached = getCachedAiResponse<AiProductivityInsight>("productivity");
        if (cached) {
            setInsight(cached);
        }
    }, []);

    const generate = useCallback(
        async (tasks: Task[], projects: Project[], githubUsername?: string | null, forceRefresh: boolean = false) => {
            if (!forceRefresh) {
                const cached = getCachedAiResponse<AiProductivityInsight>("productivity");
                if (cached) {
                    setInsight(cached);
                    setError(null);
                    return cached;
                }
            }

            setLoading(true);
            setError(null);

            try {
                const result = await generateProductivityInsights(tasks, projects, githubUsername, forceRefresh);
                setInsight(result);
                return result;
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to generate productivity insights.");
                return null;
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
