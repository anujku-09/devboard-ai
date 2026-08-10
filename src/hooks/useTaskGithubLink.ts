import { useCallback, useEffect, useState } from "react";

import {
    getTaskGithubLink,
    linkTaskToGithub,
    unlinkTaskFromGithub,
} from "../services/taskGithubLinkService";
import type { TaskGithubLink, TaskGithubLinkType } from "../types/github";

interface LinkableItem {
    number: number;
    title: string;
    state: string;
    htmlUrl: string;
}

export function useTaskGithubLink(taskId: string) {
    const [link, setLink] = useState<TaskGithubLink | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const existing = await getTaskGithubLink(taskId);
            setLink(existing);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load GitHub link.");
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const linkToGithub = useCallback(
        async (linkType: TaskGithubLinkType, item: LinkableItem) => {
            const newLink = await linkTaskToGithub(taskId, linkType, item);
            setLink(newLink);
        },
        [taskId]
    );

    const unlinkFromGithub = useCallback(async () => {
        setError(null);

        try {
            await unlinkTaskFromGithub(taskId);
            setLink(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to unlink.");
        }
    }, [taskId]);

    return { link, loading, error, linkToGithub, unlinkFromGithub };
}