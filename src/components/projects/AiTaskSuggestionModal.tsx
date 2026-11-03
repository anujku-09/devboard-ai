import { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles, ArrowRight, RefreshCw, GitBranch, Plus, Loader2, CheckSquare, Square, ShieldCheck } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { useTaskSuggestion } from "../../hooks/useTaskSuggestion";
import { createTask as createTaskService, updateTask as updateTaskService } from "../../services/taskService";
import { getRepositoryConnection } from "../../services/repositoryService";
import { listCommits } from "../../services/githubApiService";
import { addWorkspaceNotification } from "../../services/notificationService";
import type { RepositoryConnection } from "../../types/github";
import type { Project } from "../../types/project";
import type { Task, TaskPriority } from "../../types/task";
import type { AiNextTaskItem } from "../../types/ai";

const priorityPillStyles: Record<TaskPriority, string> = {
    Low: "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300",
    Medium: "bg-signal/15 text-signal border border-signal/25",
    High: "bg-danger/15 text-danger border border-danger/25",
};

interface AiTaskSuggestionModalProps {
    open: boolean;
    project: Project;
    tasks: Task[];
    repoConnection?: RepositoryConnection | null;
    onClose: () => void;
    onTaskUpdated: (updatedTask: Task) => void;
    onTaskCreated?: (newTask: Task) => void;
    onTasksCreated?: (newTasks: Task[]) => void;
}

function AiTaskSuggestionModal({
    open,
    project,
    tasks,
    repoConnection,
    onClose,
    onTaskUpdated,
    onTaskCreated,
    onTasksCreated,
}: AiTaskSuggestionModalProps) {
    const { user } = useAuth();
    const { batch, tasks: suggestedTasks, loading, error, getSuggestion } = useTaskSuggestion();

    const [activeRepo, setActiveRepo] = useState<RepositoryConnection | null>(repoConnection ?? null);
    const [fetchingCommits, setFetchingCommits] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
    const [isExecutingAction, setIsExecutingAction] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    // Resolve repository connection if not provided as prop
    useEffect(() => {
        if (!open) return;

        if (repoConnection !== undefined) {
            setActiveRepo(repoConnection);
            return;
        }

        if (project?.id) {
            void getRepositoryConnection(project.id)
                .then((conn) => setActiveRepo(conn))
                .catch(() => setActiveRepo(null));
        }
    }, [open, project?.id, repoConnection]);

    // Select all suggested tasks by default whenever a new batch is received
    useEffect(() => {
        if (suggestedTasks.length > 0) {
            setSelectedTaskIds(new Set(suggestedTasks.map((t) => t.id)));
        } else {
            setSelectedTaskIds(new Set());
        }
    }, [suggestedTasks]);

    // Fetch suggestion: uses 24-hr localStorage cache first (0 tokens) unless forceRefresh = true
    const loadSuggestion = useCallback(
        async (forceRefresh: boolean = false) => {
            if (!project) return;
            setActionError(null);
            let commitMessages: string[] = [];

            if (activeRepo?.owner && activeRepo?.name) {
                setFetchingCommits(true);
                try {
                    const commits = await listCommits(
                        activeRepo.owner,
                        activeRepo.name,
                        activeRepo.defaultBranch || "main"
                    );
                    commitMessages = commits.map((c) => c.message);
                } catch (err) {
                    console.warn("[AiTaskSuggestionModal] Could not fetch commits:", err);
                } finally {
                    setFetchingCommits(false);
                }
            }

            await getSuggestion(
                tasks,
                project.name,
                commitMessages,
                forceRefresh,
                1,
                project.description || "",
                Boolean(activeRepo),
                project.id
            );
        },
        [activeRepo, getSuggestion, project, tasks]
    );

    useEffect(() => {
        if (!open) return;
        void loadSuggestion(false);
    }, [open, loadSuggestion]);

    function toggleTask(id: string) {
        setSelectedTaskIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    function handleSelectAll() {
        if (selectedTaskIds.size === suggestedTasks.length) {
            setSelectedTaskIds(new Set());
        } else {
            setSelectedTaskIds(new Set(suggestedTasks.map((t) => t.id)));
        }
    }

    const selectedTasks = useMemo(() => {
        return suggestedTasks.filter((t) => selectedTaskIds.has(t.id));
    }, [suggestedTasks, selectedTaskIds]);

    const hasInferredTasks = selectedTasks.some((t) => t.isNewInferredTask);

    async function handlePrimaryAction() {
        if (selectedTasks.length === 0) return;
        if (!user) {
            setActionError("You must be logged in to create or start tasks.");
            return;
        }

        setIsExecutingAction(true);
        setActionError(null);

        try {
            const createdTasks: Task[] = [];

            for (const item of selectedTasks) {
                if (item.isNewInferredTask) {
                    const created = await createTaskService({
                        projectId: project.id,
                        userId: user.id,
                        title: item.title,
                        description: item.description || item.reasoning || "",
                        priority: item.priority,
                        status: "In Progress",
                        dueDate: null,
                    });
                    createdTasks.push(created);
                    onTaskCreated?.(created);
                } else {
                    const targetTask = tasks.find((t) => t.id === item.id);
                    if (targetTask) {
                        const updated = await updateTaskService({
                            ...targetTask,
                            status: "In Progress",
                        });
                        onTaskUpdated(updated);
                    }
                }
            }

            if (createdTasks.length > 0 && onTasksCreated) {
                onTasksCreated(createdTasks);
            }

            if (user?.id) {
                addWorkspaceNotification(user.id, {
                    title: "AI Next Tasks Added",
                    message: `Added ${selectedTasks.length} task(s) to ${project.name} and set to In Progress.`,
                    type: "ai",
                });
            }

            onClose();
        } catch (err) {
            console.error("Failed to execute batch task creation:", err);
            setActionError(err instanceof Error ? err.message : "Failed to execute action.");
        } finally {
            setIsExecutingAction(false);
        }
    }

    const isWorking = loading || fetchingCommits;
    const isAllSelected = suggestedTasks.length > 0 && selectedTaskIds.size === suggestedTasks.length;

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
                        className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-xl p-4 sm:p-6 max-h-[88vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                                    <Sparkles size={18} />
                                </span>
                                <h2 className="font-display text-base sm:text-xl font-semibold text-slate-900 dark:text-white">
                                    What's Next? (AI Recommendations)
                                </h2>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => void loadSuggestion(true)}
                                    disabled={isWorking || isExecutingAction}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-ember hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                                    title="Calls Gemini API to fetch a fresh set of recommendations"
                                >
                                    <RefreshCw size={12} className={isWorking ? "animate-spin" : ""} />
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

                        {/* Project Subtitle & Quota Protection Indicator */}
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3 gap-2 truncate">
                            <p className="truncate">
                                Project: <span className="font-medium text-slate-700 dark:text-slate-300">{project.name}</span>
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                                {activeRepo && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                                        <GitBranch size={10} className="text-ember" />
                                        <span>{activeRepo.name}</span>
                                    </span>
                                )}
                                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-signal/10 text-signal border border-signal/20">
                                    <ShieldCheck size={10} />
                                    <span>Quota Protected (24h Cache)</span>
                                </span>
                            </div>
                        </div>

                        {/* Multi-Selection Controls Header */}
                        {suggestedTasks.length > 0 && !isWorking && (
                            <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-surface-dark-raised/40 border border-slate-200/60 dark:border-white/5 mb-2 text-xs">
                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                    {selectedTaskIds.size} of {suggestedTasks.length} task(s) selected
                                </span>

                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="font-semibold text-ember hover:underline text-xs"
                                >
                                    {isAllSelected ? "Clear Selection" : "Select All"}
                                </button>
                            </div>
                        )}

                        {/* Modal Body */}
                        <div className="overflow-y-auto -mx-1 px-1 space-y-3 flex-1">
                            {isWorking && suggestedTasks.length === 0 ? (
                                <div className="space-y-3 p-6 text-center">
                                    <div className="h-20 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                                    <div className="h-16 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                                    <p className="text-xs text-slate-400 flex items-center justify-center gap-2 pt-2">
                                        <Loader2 size={13} className="animate-spin text-purple-400" />
                                        <span>Analyzing commit history & backlog with Gemini AI...</span>
                                    </p>
                                </div>
                            ) : error ? (
                                <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-center space-y-2">
                                    <p className="text-xs sm:text-sm text-danger">{error}</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Tip: Connect a GitHub repository in Repository Hub or add tasks to unlock AI suggestions.
                                    </p>
                                </div>
                            ) : suggestedTasks.length > 0 ? (
                                <>
                                    {/* Milestone Summary Box */}
                                    {batch?.summary && (
                                        <div className="p-3 rounded-xl border border-purple-500/25 bg-purple-500/5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                            {batch.summary}
                                        </div>
                                    )}

                                    {/* Selectable Tasks List */}
                                    <div className="space-y-2.5">
                                        {suggestedTasks.map((task: AiNextTaskItem) => {
                                            const isSelected = selectedTaskIds.has(task.id);

                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={() => toggleTask(task.id)}
                                                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                                                        isSelected
                                                            ? "border-ember/40 bg-ember/5 dark:bg-ember/10 shadow-xs"
                                                            : "border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-surface-dark-raised/30 opacity-75 hover:opacity-100"
                                                    }`}
                                                >
                                                    {/* Checkbox Icon */}
                                                    <div className="pt-0.5 shrink-0 text-ember">
                                                        {isSelected ? (
                                                            <CheckSquare size={17} className="text-ember" />
                                                        ) : (
                                                            <Square size={17} className="text-slate-400" />
                                                        )}
                                                    </div>

                                                    {/* Task Information */}
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <h4 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                                                                {task.title}
                                                            </h4>

                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <span
                                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                                        priorityPillStyles[task.priority]
                                                                    }`}
                                                                >
                                                                    {task.priority}
                                                                </span>
                                                                {task.isNewInferredTask && (
                                                                    <span className="hidden sm:inline px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-400">
                                                                        New
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {task.description && (
                                                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                                                {task.description}
                                                            </p>
                                                        )}

                                                        {task.reasoning && (
                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                                                Why: {task.reasoning}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {actionError && (
                                        <p className="text-xs text-danger text-center">{actionError}</p>
                                    )}
                                </>
                            ) : null}
                        </div>

                        {/* Footer Action Buttons */}
                        {suggestedTasks.length > 0 && (
                            <div className="flex justify-between items-center pt-3 mt-2 border-t border-slate-200 dark:border-white/10 shrink-0">
                                <span className="text-xs text-slate-400">
                                    {selectedTaskIds.size} of {suggestedTasks.length} selected
                                </span>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={isExecutingAction}
                                        className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xs font-semibold disabled:opacity-50"
                                    >
                                        Dismiss
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => void handlePrimaryAction()}
                                        disabled={isExecutingAction || selectedTaskIds.size === 0}
                                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-ember text-ink font-semibold hover:bg-ember-dark transition-colors text-xs shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isExecutingAction ? (
                                            <>
                                                <Loader2 size={13} className="animate-spin" />
                                                <span>Adding ({selectedTaskIds.size})...</span>
                                            </>
                                        ) : hasInferredTasks ? (
                                            <>
                                                <Plus size={13} />
                                                <span>Add Selected Tasks ({selectedTaskIds.size})</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Start Selected Tasks ({selectedTaskIds.size})</span>
                                                <ArrowRight size={13} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default AiTaskSuggestionModal;
