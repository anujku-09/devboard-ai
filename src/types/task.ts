export type TaskStatus =|"Todo"| "In Progress"| "Completed";
export type TaskPriority =| "Low"| "Medium"| "High";
export interface Task {
    id: string;
    projectId: string;
    userId: string;
    title: string;
    description: string
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
    createdAt: string;
}