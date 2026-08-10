import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Sparkles, CheckCircle2, GitBranch, AlertTriangle, Check, Trash2, X, ChevronRight } from "lucide-react";
import type { WorkspaceNotification } from "../types/notification";

const initialNotifications: WorkspaceNotification[] = [
    {
        id: "notif-1",
        title: "AI Breakdown Generated",
        message: "Gemini AI generated 9 actionable tasks for Graph Visualizer.",
        timestamp: "5m ago",
        type: "ai",
        read: false,
    },
    {
        id: "notif-2",
        title: "GitHub Repository Linked",
        message: "Connected anujku-09/graph_visualizer to Graph Visualizer.",
        timestamp: "25m ago",
        type: "info",
        read: false,
    },
    {
        id: "notif-3",
        title: "Project Health Diagnostic",
        message: "AI Health Score evaluated at 85/100 (Healthy).",
        timestamp: "1h ago",
        type: "success",
        read: false,
    },
];

const iconMap = {
    ai: <Sparkles size={15} className="text-ember shrink-0" />,
    info: <GitBranch size={15} className="text-blue-500 shrink-0" />,
    success: <CheckCircle2 size={15} className="text-signal shrink-0" />,
    warning: <AlertTriangle size={15} className="text-amber-500 shrink-0" />,
};

type FilterCategory = "all" | "ai" | "unread";

function NotificationPopover() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
    const [notifications, setNotifications] = useState<WorkspaceNotification[]>(() => {
        const saved = localStorage.getItem("devboard_notifications");
        return saved ? JSON.parse(saved) : initialNotifications;
    });

    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        localStorage.setItem("devboard_notifications", JSON.stringify(notifications));
    }, [notifications]);

    // Close popover when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const filteredNotifications = notifications.filter((n) => {
        if (filterCategory === "unread") return !n.read;
        if (filterCategory === "ai") return n.type === "ai";
        return true;
    });

    function markAllAsRead() {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }

    function removeNotification(id: string) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }

    function clearAll() {
        setNotifications([]);
    }

    function handleItemClick(notif: WorkspaceNotification) {
        setNotifications((prev) =>
            prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        setOpen(false);
        if (notif.type === "ai") {
            navigate("/dashboard");
        } else if (notif.type === "info") {
            navigate("/repositories");
        }
    }

    return (
        <div className="relative" ref={popoverRef}>
            {/* Bell Trigger Button */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised text-slate-600 dark:text-slate-300 hover:text-ember dark:hover:text-ember transition-colors"
                aria-label="Notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ember text-[10px] font-bold text-ink shadow-[0_0_8px_var(--color-ember)]">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Floating Popover Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-[-60px] sm:right-0 mt-2 w-[calc(100vw-28px)] max-w-[360px] sm:w-96 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Popover Header */}
                        <div className="p-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-surface-dark-raised/50 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                                        Notifications
                                    </h3>
                                    {unreadCount > 0 && (
                                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-ember/15 text-ember border border-ember/20">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>

                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={markAllAsRead}
                                        className="text-[11px] font-medium text-ember hover:underline flex items-center gap-1"
                                    >
                                        <Check size={12} />
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-200/60 dark:bg-white/10 text-[11px] font-semibold text-slate-500 w-fit">
                                <button
                                    type="button"
                                    onClick={() => setFilterCategory("all")}
                                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                                        filterCategory === "all"
                                            ? "bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-2xs font-bold"
                                            : "hover:text-slate-900 dark:hover:text-white"
                                    }`}
                                >
                                    All ({notifications.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterCategory("unread")}
                                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                                        filterCategory === "unread"
                                            ? "bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-2xs font-bold"
                                            : "hover:text-slate-900 dark:hover:text-white"
                                    }`}
                                >
                                    Unread ({unreadCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterCategory("ai")}
                                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                                        filterCategory === "ai"
                                            ? "bg-white dark:bg-surface-dark text-ember shadow-2xs font-bold"
                                            : "hover:text-slate-900 dark:hover:text-white"
                                    }`}
                                >
                                    AI Only
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 flex-1">
                            {filteredNotifications.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-400">
                                    No notifications found in this view.
                                </div>
                            ) : (
                                filteredNotifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleItemClick(notif)}
                                        className={`p-3.5 transition-colors flex items-start gap-3 relative group cursor-pointer ${
                                            notif.read
                                                ? "bg-white dark:bg-surface-dark opacity-75 hover:bg-slate-50 dark:hover:bg-white/5"
                                                : "bg-ember/5 dark:bg-ember/10 font-medium hover:bg-ember/10"
                                        }`}
                                    >
                                        <span className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 shrink-0 mt-0.5 border border-slate-200/50 dark:border-white/10">
                                            {iconMap[notif.type]}
                                        </span>

                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center justify-between gap-1">
                                                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                                    {!notif.read && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-ember shrink-0 animate-pulse" />
                                                    )}
                                                    <span className="truncate">{notif.title}</span>
                                                </h4>
                                                <span className="text-[10px] text-slate-400 shrink-0">
                                                    {notif.timestamp}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                                                {notif.message}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeNotification(notif.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-danger rounded transition-opacity"
                                                title="Remove notification"
                                            >
                                                <X size={13} />
                                            </button>
                                            <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-ember transition-colors" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-2.5 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-surface-dark-raised/30 flex justify-end">
                                <button
                                    type="button"
                                    onClick={clearAll}
                                    className="text-xs font-medium text-slate-400 hover:text-danger transition-colors flex items-center gap-1 px-2 py-1"
                                >
                                    <Trash2 size={12} />
                                    Clear all notifications
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default NotificationPopover;
