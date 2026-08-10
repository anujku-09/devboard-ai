import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";

import { useTaskSuggestion } from "../../hooks/useTaskSuggestion";
import { updateTask } from "../../services/taskService";
import type { Project } from "../../types/project";
import type { Task } from "../../types/task";

interface AiTaskSuggestionModalProps {
    open: boolean;
    project: Project;
    tasks: Task[];
    onClose: () => void;
    onTaskUpdated: (updatedTask: Task) => void;
}

function AiTaskSuggestionModal({
    open,
    project,
    tasks,
    onClose,
    onTaskUpdated,
}: AiTaskSuggestionModalProps) {
    const { suggestion, loading, error, getSuggestion } = useTaskSuggestion();

    useEffect(() => {
        if (!open) return;
        void getSuggestion(tasks, project.name, [], false);
    }, [open, tasks, project.name, getSuggestion]);

    async function handleSetInProgress() {
        if (!suggestion) return;
        const targetTask = tasks.find((t) => t.id === suggestion.suggestedTaskId);
        if (!targetTask) return;

        try {
            const updated = await updateTask({
                ...targetTask,
                status: "In Progress",
            });
            onTaskUpdated(updated);
            onClose();
        } catch (err) {
            console.error("Failed to update task status:", err);
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
                                <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                                    <Sparkles size={18} />
                                </span>
                                <h2 className="font-display text-base sm:text-xl font-semibold text-slate-900 dark:text-white">
                                    Next Recommended Task
                                </h2>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => void getSuggestion(tasks, project.name, [], true)}
                                    disabled={loading}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-ember hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                    title="Bypass 30-min cache and fetch fresh AI task recommendation"
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
                            AI prioritization for <span className="font-medium text-slate-700 dark:text-slate-300">{project.name}</span>
                        </p>

                        <div className="overflow-y-auto -mx-1 px-1 space-y-3 sm:space-y-4 flex-1">
                            {loading && !suggestion ? (
                                <div className="space-y-3 p-4">
                                    <div className="h-20 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                                    <div className="h-16 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                                </div>
                            ) : error ? (
                                <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-center">
                                    <p className="text-xs sm:text-sm text-danger">{error}</p>
                                </div>
                            ) : suggestion ? (
                                <>
                                    {/* Recommended Task Highlight Card */}
                                    <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/20">
                                                Top Priority Target
                                            </span>
                                        </div>
                                        <h3 className="font-display font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                                            {suggestion.suggestedTaskTitle}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                            {suggestion.reasoning}
                                        </p>
                                    </div>

                                    {/* Action Steps */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                            <CheckCircle2 size={13} className="text-signal" />
                                            <span>Recommended Execution Steps</span>
                                        </h4>
                                        <div className="space-y-1.5">
                                            {suggestion.recommendedNextSteps.map((step, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-surface-dark-raised/40 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                                                >
                                                    <span className="font-bold text-purple-400 shrink-0">{idx + 1}.</span>
                                                    <span>{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {suggestion && (
                            <div className="flex justify-end gap-2.5 pt-4 mt-2 border-t border-slate-200 dark:border-white/10 shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xs font-semibold"
                                >
                                    Dismiss
                                </button>

                                <button
                                    type="button"
                                    onClick={() => void handleSetInProgress()}
                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-colors text-xs shadow-xs"
                                >
                                    <span>Move Task to "In Progress"</span>
                                    <ArrowRight size={13} />
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default AiTaskSuggestionModal;
