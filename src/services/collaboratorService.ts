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

function deduplicateCollaborators(list: ProjectCollaborator[]): ProjectCollaborator[] {
    const seen = new Set<string>();
    return list.filter((item) => {
        const lower = item.email.toLowerCase();
        if (seen.has(lower)) return false;
        seen.add(lower);
        return true;
    });
}

function getLocalCollaborators(projectId: string): ProjectCollaborator[] {
    try {
        const raw = localStorage.getItem(`collaborators_${projectId}`);
        const parsed: ProjectCollaborator[] = raw ? JSON.parse(raw) : [];
        return deduplicateCollaborators(parsed);
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

        const mapped = (data as CollaboratorRow[]).map(mapCollaborator);
        return deduplicateCollaborators(mapped);
    } catch {
        return getLocalCollaborators(projectId);
    }
}

export async function addProjectCollaborator(
    projectId: string,
    email: string,
    role: CollaboratorRole
): Promise<ProjectCollaborator> {
    const cleanEmail = email.trim().toLowerCase();

    // Check existing collaborators first
    const existing = await getProjectCollaborators(projectId);
    if (existing.some((c) => c.email.toLowerCase() === cleanEmail)) {
        throw new Error("This email address has already been added to the team.");
    }

    const newCollaborator: ProjectCollaborator = {
        id: `collab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        projectId,
        email: cleanEmail,
        role,
        createdAt: new Date().toISOString(),
    };

    try {
        const { data, error } = await supabase
            .from("project_collaborators")
            .insert({
                project_id: projectId,
                email: cleanEmail,
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
