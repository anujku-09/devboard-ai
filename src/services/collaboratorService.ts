import { supabase } from "../lib/supabase";
import type { ProjectCollaborator, CollaboratorRole } from "../types/project";

interface CollaboratorRow {
    id: string;
    project_id: string;
    email: string;
    role: CollaboratorRole;
    created_at: string;
}

function mapCollaborator(row: CollaboratorRow): ProjectCollaborator {
    return {
        id: row.id,
        projectId: row.project_id,
        email: row.email,
        role: row.role,
        createdAt: row.created_at,
    };
}

function getLocalCollaborators(projectId: string): ProjectCollaborator[] {
    try {
        const raw = localStorage.getItem(`collaborators_${projectId}`);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveLocalCollaborator(projectId: string, collaborator: ProjectCollaborator): void {
    try {
        const list = getLocalCollaborators(projectId);
        const filtered = list.filter((c) => c.email.toLowerCase() !== collaborator.email.toLowerCase());
        const updated = [...filtered, collaborator];
        localStorage.setItem(`collaborators_${projectId}`, JSON.stringify(updated));
    } catch (e) {
        console.error("Failed to save local collaborator:", e);
    }
}

function removeLocalCollaborator(projectId: string, id: string): void {
    try {
        const list = getLocalCollaborators(projectId);
        const updated = list.filter((c) => c.id !== id);
        localStorage.setItem(`collaborators_${projectId}`, JSON.stringify(updated));
    } catch (e) {
        console.error("Failed to remove local collaborator:", e);
    }
}

export async function getProjectCollaborators(projectId: string): Promise<ProjectCollaborator[]> {
    try {
        const { data, error } = await supabase
            .from("project_collaborators")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: true });

        if (error || !data) {
            return getLocalCollaborators(projectId);
        }

        return (data as CollaboratorRow[]).map(mapCollaborator);
    } catch {
        return getLocalCollaborators(projectId);
    }
}

export async function addProjectCollaborator(
    projectId: string,
    email: string,
    role: CollaboratorRole
): Promise<ProjectCollaborator> {
    const newCollaborator: ProjectCollaborator = {
        id: `collab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        projectId,
        email: email.trim().toLowerCase(),
        role,
        createdAt: new Date().toISOString(),
    };

    try {
        const { data, error } = await supabase
            .from("project_collaborators")
            .insert({
                project_id: projectId,
                email: email.trim().toLowerCase(),
                role,
            })
            .select()
            .single();

        if (error || !data) {
            saveLocalCollaborator(projectId, newCollaborator);
            return newCollaborator;
        }

        return mapCollaborator(data as CollaboratorRow);
    } catch {
        saveLocalCollaborator(projectId, newCollaborator);
        return newCollaborator;
    }
}

export async function removeProjectCollaborator(projectId: string, id: string): Promise<void> {
    try {
        const { error } = await supabase
            .from("project_collaborators")
            .delete()
            .eq("id", id);

        if (error) {
            removeLocalCollaborator(projectId, id);
        }
    } catch {
        removeLocalCollaborator(projectId, id);
    }
}
