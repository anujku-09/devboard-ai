import type { Task } from "../types/task";

export interface CalculatedProgress {
    progress: number;
    completedCount: number;
    totalCount: number;
}

/**
 * Calculates project completion percentage dynamically from task statuses.
 * Formula: (Completed Tasks / Total Tasks) * 100
 */
export function calculateProjectProgress(
    tasks: Task[],
    projectId: string,
    fallbackProgress: number = 0
): CalculatedProgress {
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    const totalCount = projectTasks.length;

    if (totalCount === 0) {
        return {
            progress: fallbackProgress,
            completedCount: 0,
            totalCount: 0,
        };
    }

    const completedCount = projectTasks.filter((t) => t.status === "Completed").length;
    const progress = Math.round((completedCount / totalCount) * 100);

    return {
        progress,
        completedCount,
        totalCount,
    };
}
