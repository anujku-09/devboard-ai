import type { WorkspaceNotification, NotificationType } from "../types/notification";

const NOTIFICATION_EVENT = "devboard:notification_change";

function getStorageKey(userId?: string | null): string {
    return `devboard_notifications_${userId || "guest"}`;
}

/**
 * Returns notifications scoped strictly to the authenticated user.
 * Avoids global/shared localStorage leakage across accounts.
 */
export function getStoredNotifications(userId?: string | null): WorkspaceNotification[] {
    // Clean up legacy global key if it exists
    if (localStorage.getItem("devboard_notifications")) {
        localStorage.removeItem("devboard_notifications");
    }

    try {
        const key = getStorageKey(userId);
        const raw = localStorage.getItem(key);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn("Failed to load notifications from localStorage:", e);
    }

    // Default clean welcome notification for a new user
    return [
        {
            id: `welcome-${userId || "init"}`,
            title: "Welcome to DevBoard AI",
            message: "Your workspace is ready. Create a project to start planning with Gemini AI.",
            timestamp: "Just now",
            type: "info",
            read: false,
        },
    ];
}

export function saveStoredNotifications(
    userId: string | null | undefined,
    notifications: WorkspaceNotification[]
): void {
    try {
        const key = getStorageKey(userId);
        localStorage.setItem(key, JSON.stringify(notifications));
    } catch (e) {
        console.warn("Failed to save notifications to localStorage:", e);
    }
}

export function addWorkspaceNotification(
    userId: string | null | undefined,
    item: {
        title: string;
        message: string;
        type: NotificationType;
    }
): void {
    if (!userId) return;

    const current = getStoredNotifications(userId);
    const newNotif: WorkspaceNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: item.title,
        message: item.message,
        type: item.type,
        timestamp: "Just now",
        read: false,
    };

    // Keep the most recent 20 notifications for the user
    const updated = [newNotif, ...current.slice(0, 19)];
    saveStoredNotifications(userId, updated);
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: { userId } }));
}
