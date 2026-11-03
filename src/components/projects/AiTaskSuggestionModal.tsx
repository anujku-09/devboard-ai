import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles, ArrowRight, RefreshCw, CheckCircle2, GitBranch, Plus, Loader2 } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { useTaskSuggestion } from "../../hooks/useTaskSuggestion";
import { createTask as createTaskService, updateTask as updateTaskService } from "../../services/taskService";
import { getRepositoryConnection } from "../../services/repositoryService";
import { listCommits } from "../../services/githubApiService";
import { addWorkspaceNotification } from "../../services/notificationService";
import type { RepositoryConnection } from "../../types/github";
import type { Project } from "../../types/project";
import type { Task } from "../../types/task";

interface AiTaskSuggestionModalProps {
    open: boolean;
    project: Project;
    tasks: Task[];
    repoConnection?: RepositoryConnection | null;
    onClose: () => void;
    onTaskUpdated: (updatedTask: Task) => void;
    onTaskCreated?: (newTask: Task) => void;
}

function AiTaskSuggestionModal({
    open,
    project,
    tasks,
    repoConnection,
    onClose,
    onTaskUpdated,
    onTaskCreated,
}: AiTaskSuggestionModalProps) {
    const { user } = useAuth();
    const { suggestion, loading, error, getSuggestion } = useTaskSuggestion();

    const [activeRepo, setActiveRepo] = useState<RepositoryConnection | null>(repoConnection ?? null);
    const [fetchingCommits, setFetchingCommits] = useState(false);
    const [isExecutingAction, setIsExecutingAction] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    // Resolve repository connection if not explicitly provided as prop
    useEffect(() => {
        if (!open) return;

        if (repoConnection !== undefined) {
            setActiveRepo(repoConnection);
            return;
        }

        if (project?.id) {
            void getRepositoryConnection(project.id)
                .then((conn) => setActiveRepo(conn))
                .catch((err) => {
                    console.warn("Could not retrieve repository connection for project:", err);
                    setActiveRepo(null);
                });
        }
    }, [open, project?.id, repoConnection]);

    const loadSuggestion = useCallback(
        async (forceRefresh: boolean = false) => {
            if (!project) return;

            setActionError(null);
            let commitMessages: string[] = [];

            // If a repository is connected, fetch recent commits from GitHub REST API
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
                    console.warn("[AiTaskSuggestionModal] Failed to fetch git commits:", err);
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
                Boolean(activeRepo)
            );
        },
        [activeRepo, getSuggestion, project, tasks]
    );

    useEffect(() => {
        if (!open) return;
        void loadSuggestion(false);
    }, [open, loadSuggestion]);

    async function handlePrimaryAction() {
        if (!suggestion) return;
        setIsExecutingAction(true);
        setActionError(null);

        if (!user) {
            setActionError("You must be logged in to create or start a task.");
            return;
        }

        try {
            if (suggestion.isNewInferredTask) {
                // Scenario: AI suggested a brand new task from commits & project scope
                const created = await createTaskService({
                    projectId: project.id,
                    userId: user.id,
                    title: suggestion.suggestedTaskTitle,
                    description: suggestion.suggestedTaskDescription || suggestion.reasoning || "",
                    priority: suggestion.priority || "High",
                    status: "In Progress",
                    dueDate: null,
                });

                if (user?.id) {
                    addWorkspaceNotification(user.id, {
                        title: "AI Suggested Task Started",
                        message: `Added "${suggestion.suggestedTaskTitle}" to ${project.name} and marked In Progress.`,
                        type: "ai",
                    });
                }

                if (onTaskCreated) {
                    onTaskCreated(created);
                } else {
                    onTaskUpdated(created);
                }
                onClose();
            } else {
                // Scenario: AI prioritized an existing backlog task
                const targetTask = tasks.find((t) => t.id === suggestion.suggestedTaskId);
                if (!targetTask) {
                    throw new Error("Could not find the target task in the project backlog.");
                }

                const updated = await updateTaskService({
                    ...targetTask,
                    status: "In Progress",
                });

                if (user?.id) {
                    addWorkspaceNotification(user.id, {
                        title: "Task Priority Started",
                        message: `Moved "${targetTask.title}" to In Progress based on AI recommendation.`,
                        type: "ai",
                    });
                }

                onTaskUpdated(updated);
                onClose();
            }
        } catch (err) {
            console.error("Failed to execute task action:", err);
            setActionError(err instanceof Error ? err.message : "Failed to execute action.");
        } finally {
            setIsExecutingAction(false);
        }
    }

    const isWorking = loading || fetchingCommits;

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
                        {/* Header */}
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
                                    onClick={() => void loadSuggestion(true)}
                                    disabled={isWorking || isExecutingAction}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-ember hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                                    title="Bypass cache and fetch fresh AI task recommendation"
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

                        {/* Subtitle / Repo badge */}
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3 gap-2 truncate">
                            <p className="truncate">
                                Prioritizing for <span className="font-medium text-slate-700 dark:text-slate-300">{project.name}</span>
                            </p>
                            {activeRepo && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 shrink-0">
                                    <GitBranch size={10} className="text-ember" />
                                    <span>{activeRepo.name}</span>
                                </span>
                            )}
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto -mx-1 px-1 space-y-3 sm:space-y-4 flex-1">
                            {isWorking && !suggestion ? (
                                <div className="space-y-3 p-4 text-center">
                                    <div className="h-20 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                                    <div className="h-16 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                                    <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                                        <Loader2 size={13} className="animate-spin text-purple-400" />
                                        <span>
                                            {activeRepo
                                                ? "Analyzing git commit history & project scope with Gemini AI..."
                                                : "Evaluating project backlog with Gemini AI..."}
                                        </span>
                                    </p>
                                </div>
                            ) : error ? (
                                <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-center space-y-2">
                                    <p className="text-xs sm:text-sm text-danger">{error}</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Tip: Connect a GitHub repository in Repository Hub or add tasks to unlock AI suggestions.
                                    </p>
                                </div>
                            ) : suggestion ? (
                                <>
                                    {/* Recommended Task Highlight Card */}
                                    <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2.5">
                                        <div className="flex items-center justify-between gap-2">
                                            {suggestion.isNewInferredTask ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-ember/15 text-ember border border-ember/25">
                                                    <GitBranch size={11} />
                                                    <span>Inferred from Git Commits & Project Context</span>
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/20">
                                                    Top Priority Target
                                                </span>
                                            )}

                                            {suggestion.priority && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                                    {suggestion.priority} Priority
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="font-display font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                                            {suggestion.suggestedTaskTitle}
                                        </h3>

                                        {suggestion.suggestedTaskDescription && (
                                            <p className="text-xs text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-surface-dark-raised/60 p-2.5 rounded-lg border border-slate-200/50 dark:border-white/5 leading-relaxed">
                                                {suggestion.suggestedTaskDescription}
                                            </p>
                                        )}

                                        <div className="space-y-1">
                                            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                                                Why This Is Next
                                            </p>
                                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                                {suggestion.reasoning}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Steps */}
                                    {suggestion.recommendedNextSteps?.length > 0 && (
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
                                    )}

                                    {actionError && (
                                        <p className="text-xs text-danger text-center">{actionError}</p>
                                    )}
                                </>
                            ) : null}
                        </div>

                        {/* Footer Action Buttons */}
                        {suggestion && (
                            <div className="flex justify-end gap-2.5 pt-4 mt-2 border-t border-slate-200 dark:border-white/10 shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isExecutingAction}
                                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-xs font-semibold disabled:opacity-50"
                                >
                                    Dismiss
                                </button>

                                <button
                                    type="button"
                                    onClick={() => void handlePrimaryAction()}
                                    disabled={isExecutingAction}
                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-colors text-xs shadow-xs disabled:opacity-50"
                                >
                                    {isExecutingAction ? (
                                        <>
                                            <Loader2 size={13} className="animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : suggestion.isNewInferredTask ? (
                                        <>
                                            <Plus size={13} />
                                            <span>Create & Start This Task</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Move Task to "In Progress"</span>
                                            <ArrowRight size={13} />
                                        </>
                                    )}
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
