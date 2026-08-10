import { supabase } from "../lib/supabase";
import type { Project } from "../types/project";

export type ProjectInput = Omit<Project, "id" | "user_id" | "created_at">;

interface ProjectRow {
    id: string;
    user_id: string;
    name: string;
    description: string;
    status: Project["status"];
    progress: number;
    created_at: string;
}

function mapRow(row: ProjectRow): Project {
    return {
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        description: row.description,
        status: row.status,
        progress: row.progress,
        created_at: row.created_at,
    };
}

export async function getProjects(): Promise<Project[]> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return [];

    const userEmail = user.email?.toLowerCase();

    // 1. Query projects owned by current user
    const { data: ownedProjects, error: ownedError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (ownedError) throw ownedError;
    const projectList = (ownedProjects ?? []).map(mapRow);
    const existingIds = new Set(projectList.map((p) => p.id));

    // 2. Query projects where current user email is in project_collaborators
    if (userEmail) {
        try {
            const { data: collabEntries } = await supabase
                .from("project_collaborators")
                .select("project_id")
                .ilike("email", userEmail);

            const collabProjectIds = (collabEntries ?? [])
                .map((c) => c.project_id)
                .filter((id) => !existingIds.has(id));

            if (collabProjectIds.length > 0) {
                const { data: collabProjects } = await supabase
                    .from("projects")
                    .select("*")
                    .in("id", collabProjectIds);

                if (collabProjects) {
                    collabProjects.forEach((p) => {
                        projectList.push(mapRow(p));
                        existingIds.add(p.id);
                    });
                }
            }
        } catch (e) {
            console.warn("Failed to fetch Supabase collaborator projects:", e);
        }

        // 3. Fallback: LocalStorage check for invited projects
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith("collaborators_")) {
                    const projId = key.replace("collaborators_", "");
                    if (!existingIds.has(projId)) {
                        const raw = localStorage.getItem(key);
                        if (raw) {
                            const list: Array<{ email: string }> = JSON.parse(raw);
                            if (list.some((c) => c.email.toLowerCase() === userEmail)) {
                                const { data: proj } = await supabase
                                    .from("projects")
                                    .select("*")
                                    .eq("id", projId)
                                    .single();
                                if (proj) {
                                    projectList.push(mapRow(proj));
                                    existingIds.add(proj.id);
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.warn("Failed to check local storage collaborator projects:", e);
        }
    }

    return projectList;
}

export async function getProjectById(id: string): Promise<Project> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error("You must be logged in to view this project.");

    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw error;
    return mapRow(data);
}

export async function createProject(project: ProjectInput): Promise<Project> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error("You must be logged in to create a project.");

    const { data, error } = await supabase
        .from("projects")
        .insert({
            user_id: user.id,
            name: project.name,
            description: project.description,
            status: project.status,
            progress: project.progress,
        })
        .select()
        .single();

    if (error) throw error;
    return mapRow(data);
}

export async function updateProject(id: string, updates: ProjectInput): Promise<Project> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error("You must be logged in to update a project.");

    const { data, error } = await supabase
        .from("projects")
        .update({
            name: updates.name,
            description: updates.description,
            status: updates.status,
            progress: updates.progress,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return mapRow(data);
}

export async function updateProjectProgress(id: string, progress: number): Promise<void> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return;

    await supabase
        .from("projects")
        .update({ progress })
        .eq("id", id);
}

export async function deleteProject(id: string): Promise<void> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error("You must be logged in to delete a project.");

    const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) throw error;
}