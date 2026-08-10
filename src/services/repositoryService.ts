import { supabase } from "../lib/supabase";
import type { GithubRepo, RepositoryConnection } from "../types/github";

interface RepositoryConnectionRow {
    id: string;
    project_id: string;
    user_id: string;
    github_repo_id: number;
    full_name: string;
    name: string;
    owner: string;
    is_private: boolean;
    html_url: string;
    default_branch: string;
    connected_at: string;
}

function mapConnection(row: RepositoryConnectionRow): RepositoryConnection {
    return {
        id: row.id,
        projectId: row.project_id,
        userId: row.user_id,
        githubRepoId: row.github_repo_id,
        fullName: row.full_name,
        name: row.name,
        owner: row.owner,
        private: row.is_private,
        htmlUrl: row.html_url,
        defaultBranch: row.default_branch,
        connectedAt: row.connected_at,
    };
}

export async function getRepositoryConnection(
    projectId: string
): Promise<RepositoryConnection | null> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) return null;

    const { data, error } = await supabase
        .from("repository_connections")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapConnection(data as RepositoryConnectionRow);
}

export async function getAllRepositoryConnections(): Promise<RepositoryConnection[]> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return [];

    const { data, error } = await supabase
        .from("repository_connections")
        .select("*")
        .eq("user_id", user.id);

    if (error) {
        console.error("Failed to fetch repository connections:", error);
        return [];
    }

    return (data ?? []).map((row) => mapConnection(row as RepositoryConnectionRow));
}

export async function connectRepository(
    projectId: string,
    repo: GithubRepo
): Promise<RepositoryConnection> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error("You must be signed in to connect a repository.");

    const { data, error } = await supabase
        .from("repository_connections")
        .upsert(
            {
                project_id: projectId,
                user_id: user.id,
                github_repo_id: repo.id,
                full_name: repo.fullName,
                name: repo.name,
                owner: repo.owner,
                is_private: repo.private,
                html_url: repo.htmlUrl,
                default_branch: repo.defaultBranch,
                connected_at: new Date().toISOString(),
            },
            { onConflict: "project_id" }
        )
        .select()
        .single();

    if (error) throw error;
    return mapConnection(data as RepositoryConnectionRow);
}

export async function disconnectRepository(projectId: string): Promise<void> {
    const { error } = await supabase
        .from("repository_connections")
        .delete()
        .eq("project_id", projectId);

    if (error) throw error;
}