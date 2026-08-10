import type { Project } from "../types/project";
import type { Task } from "../types/task";

export type ActivityType = "project_created" | "task_created" | "task_completed";

export interface ActivityEntry {
    id: string;
    type: ActivityType;
    title: string;
    description: string;
    timestamp: string;
}

/**
 * Derives a unified, time-sorted activity feed from raw project and task
 * records. No dedicated "activities" table exists yet, so entries are
 * inferred from record creation and status rather than stored separately.
 */
export function buildActivityFeed(
    projects: Project[],
    tasks: Task[],
    limit = 8
): ActivityEntry[] {
    const projectEntries: ActivityEntry[] = projects.map((project) => ({
        id: `project-${project.id}`,
        type: "project_created",
        title: project.name,
        description: "New project created",
        timestamp: project.created_at,
    }));

    const taskEntries: ActivityEntry[] = tasks.map((task) => ({
        id: `task-${task.id}`,
        type: task.status === "Completed" ? "task_completed" : "task_created",
        title: task.title,
        description:
            task.status === "Completed" ? "Task marked as completed" : "New task added",
        timestamp: task.createdAt,
    }));

    return [...projectEntries, ...taskEntries]
        .sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, limit);
}
