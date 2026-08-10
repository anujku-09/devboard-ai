import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles, RefreshCw } from "lucide-react";

import { createTask } from "../../services/taskService";
import { useProjectBreakdown } from "../../hooks/useProjectBreakdown";
import { useAuth } from "../../hooks/useAuth";
import type { Project } from "../../types/project";
import type { Task, TaskPriority } from "../../types/task";

const priorityStyles: Record<TaskPriority, string> = {
    Low: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
    Medium: "bg-signal/10 text-signal",
    High: "bg-danger/10 text-danger",
};

interface ProjectBreakdownModalProps {
    open: boolean;
    project: Project;
    onClose: () => void;
    onTasksCreated: (tasks: Task[]) => void;
}

function ProjectBreakdownModal({ open, project, onClose, onTasksCreated }: ProjectBreakdownModalProps) {
    const { user } = useAuth();
    const { tasks, loading, error, generate } = useProjectBreakdown();
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setCreateError(null);
        void generate(project.name, project.description, false);
    }, [open, project.name, project.description, generate]);

    useEffect(() => {
        setSelected(new Set(tasks.map((_, index) => index)));
    }, [tasks]);

    function toggle(index: number) {
        setSelected((previous) => {
            const next = new Set(previous);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    }

    async function handleAddTasks() {
        if (!user || selected.size === 0) return;

        setCreating(true);
        setCreateError(null);

        const chosen = tasks.filter((_, index) => selected.has(index));

        try {
            const created = await Promise.all(
                chosen.map((item) =>
                    createTask({
                        projectId: project.id,
                        userId: user.id,
                        title: item.title,
                        description: item.description,
                        status: "Todo",
                        priority: item.priority,
                        dueDate: null,
                    })
                )
            );

            onTasksCreated(created);
            onClose();
        } catch (err) {
            setCreateError(err instanceof Error ? err.message : "Failed to create tasks.");
        } finally {
            setCreating(false);
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={(event) => event.stopPropagation()}
                        className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[85vh] flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-ember/10 text-ember shrink-0">
                                    <Sparkles size={18} />
                                </span>
                                <h2 className="font-display text-base sm:text-xl font-semibold text-slate-900 dark:text-white">
                                    AI Feature Breakdown
                                </h2>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => void generate(project.name, project.description, true)}
                                    disabled={loading}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-ember hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                    title="Bypass 30-min cache and fetch fresh AI breakdown"
                                >
                                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                                    <span>Refresh</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3 truncate">
                            Suggested tasks for <span className="font-medium text-slate-700 dark:text-slate-300">{project.name}</span>
                        </p>

                        <div className="overflow-y-auto -mx-1 px-1 space-y-2 flex-1">
                            {loading && !tasks.length ? (
                                Array.from({ length: 4 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="h-16 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse"
                                    />
                                ))
                            ) : error ? (
                                <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-center">
                                    <p className="text-xs sm:text-sm text-danger">{error}</p>
                                </div>
                            ) : tasks.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-6 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    No task suggestions generated yet.
                                </div>
                            ) : (
                                tasks.map((item, index) => {
                                    const checked = selected.has(index);
                                    return (
                                        <div
                                            key={index}
                                            onClick={() => toggle(index)}
                                            className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                                                checked
                                                    ? "border-ember/40 bg-ember/5 dark:bg-ember/10"
                                                    : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggle(index)}
                                                className="mt-1 rounded border-slate-300 dark:border-white/20 text-ember focus:ring-ember accent-ember cursor-pointer shrink-0"
                                            />
                                            <div className="min-w-0 flex-1 space-y-0.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-medium text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate">
                                                        {item.title}
                                                    </p>
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${priorityStyles[item.priority]}`}
                                                    >
                                                        {item.priority}
                                                    </span>
                                                </div>
                                                {item.description && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {createError && (
                            <p className="text-xs text-danger mt-2">{createError}</p>
                        )}

                        <div className="flex justify-end gap-2.5 pt-4 mt-2 border-t border-slate-200 dark:border-white/10 shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xs font-semibold"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => void handleAddTasks()}
                                disabled={selected.size === 0 || creating || loading}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-ember text-ink font-semibold hover:bg-ember-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs shadow-xs"
                            >
                                {creating && (
                                    <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
                                )}
                                <span>
                                    {creating
                                        ? "Adding..."
                                        : `Add ${selected.size} Task${selected.size === 1 ? "" : "s"} to Board`}
                                </span>
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default ProjectBreakdownModal;
