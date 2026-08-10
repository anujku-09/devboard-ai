import { useCallback, useEffect, useState } from "react";
import {
    getProjectCollaborators,
    addProjectCollaborator,
    removeProjectCollaborator,
} from "../services/collaboratorService";
import type { ProjectCollaborator, CollaboratorRole } from "../types/project";

export function useProjectCollaborators(projectId: string | undefined) {
    const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!projectId) {
            setCollaborators([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await getProjectCollaborators(projectId);
            setCollaborators(data);
        } catch (err) {
            console.error("Failed to load collaborators:", err);
            setError(err instanceof Error ? err.message : "Failed to load project collaborators.");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const addCollaborator = useCallback(
        async (email: string, role: CollaboratorRole) => {
            if (!projectId) return;
            setError(null);
            try {
                const created = await addProjectCollaborator(projectId, email, role);
                setCollaborators((prev) => [
                    ...prev.filter((c) => c.email.toLowerCase() !== email.toLowerCase()),
                    created,
                ]);
            } catch (err) {
                console.error("Failed to add collaborator:", err);
                setError(err instanceof Error ? err.message : "Failed to add collaborator.");
                throw err;
            }
        },
        [projectId]
    );

    const removeCollaborator = useCallback(
        async (id: string) => {
            if (!projectId) return;
            setError(null);
            try {
                await removeProjectCollaborator(projectId, id);
                setCollaborators((prev) => prev.filter((c) => c.id !== id));
            } catch (err) {
                console.error("Failed to remove collaborator:", err);
                setError(err instanceof Error ? err.message : "Failed to remove collaborator.");
                throw err;
            }
        },
        [projectId]
    );

    return {
        collaborators,
        loading,
        error,
        addCollaborator,
        removeCollaborator,
        refresh,
    };
}
