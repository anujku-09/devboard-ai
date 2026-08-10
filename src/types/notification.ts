export type NotificationType = "info" | "success" | "warning" | "ai";

export interface WorkspaceNotification {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    type: NotificationType;
    read: boolean;
}
