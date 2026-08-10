import { supabase } from "../lib/supabase";
import type { TaskGithubLink, TaskGithubLinkType } from "../types/github";

interface TaskGithubLinkRow {
    id: string;
    task_id: string;
    user_id: string;
    link_type: TaskGithubLinkType;
    github_number: number;
    title: string;
    state: string;
    html_url: string;
    linked_at: string;
}

interface LinkableItem {
    number: number;
    title: string;
    state: string;
    htmlUrl: string;
}

function mapLink(row: TaskGithubLinkRow): TaskGithubLink {
    return {
        id: row.id,
        taskId: row.task_id,
        userId: row.user_id,
        linkType: row.link_type,
        number: row.github_number,
        title: row.title,
        state: row.state,
        htmlUrl: row.html_url,
        linkedAt: row.linked_at,
    };
}

export async function getTaskGithubLink(taskId: string): Promise<TaskGithubLink | null> {
    const { data, error } = await supabase
        .from("task_github_links")
        .select("*")
        .eq("task_id", taskId)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapLink(data as TaskGithubLinkRow);
}

/**
 * Batch-fetches links for a set of task ids, keyed by task_id. Used by
 * task list views to avoid an N+1 query per card.
 */
export async function getTaskGithubLinksForTasks(
    taskIds: string[]
): Promise<Record<string, TaskGithubLink>> {
    if (taskIds.length === 0) return {};

    const { data, error } = await supabase
        .from("task_github_links")
        .select("*")
        .in("task_id", taskIds);

    if (error) throw error;

    const map: Record<string, TaskGithubLink> = {};
    for (const row of (data ?? []) as TaskGithubLinkRow[]) {
        map[row.task_id] = mapLink(row);
    }

    return map;
}

export async function linkTaskToGithub(
    taskId: string,
    linkType: TaskGithubLinkType,
    item: LinkableItem
): Promise<TaskGithubLink> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) throw new Error("You must be signed in to link a task.");

    const { data, error } = await supabase
        .from("task_github_links")
        .upsert(
            {
                task_id: taskId,
                user_id: user.id,
                link_type: linkType,
                github_number: item.number,
                title: item.title,
                state: item.state,
                html_url: item.htmlUrl,
                linked_at: new Date().toISOString(),
            },
            { onConflict: "task_id" }
        )
        .select()
        .single();

    if (error) throw error;
    return mapLink(data as TaskGithubLinkRow);
}

export async function unlinkTaskFromGithub(taskId: string): Promise<void> {
    const { error } = await supabase
        .from("task_github_links")
        .delete()
        .eq("task_id", taskId);

    if (error) throw error;
}