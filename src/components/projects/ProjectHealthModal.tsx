import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Activity, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";
import { useProjectHealth } from "../../hooks/useProjectHealth";
import type { Project } from "../../types/project";
import type { Task } from "../../types/task";

const statusConfig = {
    Healthy: {
        bg: "bg-signal/10",
        text: "text-signal",
        border: "border-signal/30",
    },
    "Needs Attention": {
        bg: "bg-amber-500/10",
        text: "text-amber-500",
        border: "border-amber-500/30",
    },
    "At Risk": {
        bg: "bg-danger/10",
        text: "text-danger",
        border: "border-danger/30",
    },
};

interface ProjectHealthModalProps {
    open: boolean;
    project: Project;
    tasks: Task[];
    repoConnected: boolean;
    onClose: () => void;
}

function ProjectHealthModal({
    open,
    project,
    tasks,
    repoConnected,
    onClose,
}: ProjectHealthModalProps) {
    const { health, loading, error, analyze } = useProjectHealth();

    useEffect(() => {
        if (!open) return;
        void analyze(project, tasks, repoConnected);
    }, [open, project, tasks, repoConnected, analyze]);

    return createPortal(
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
                        className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-xl p-4 sm:p-6 max-h-[90vh] flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-2 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="p-1.5 rounded-lg bg-signal/10 text-signal shrink-0">
                                    <Activity size={18} />
                                </span>
                                <h2 className="font-display text-base sm:text-xl font-semibold text-slate-900 dark:text-white truncate">
                                    AI Health Diagnostic
                                </h2>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => void analyze(project, tasks, repoConnected, true)}
                                    disabled={loading}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-ember hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                    title="Bypass 30-min cache and fetch fresh AI analysis"
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
                            Evaluation for <span className="font-medium text-slate-700 dark:text-slate-300">{project.name}</span>
                        </p>

                        <div className="overflow-y-auto -mx-1 px-1 space-y-3 sm:space-y-4 flex-1">
                            {loading && !health ? (
                                <div className="space-y-3 p-4">
                                    <div className="h-20 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                                    <div className="h-16 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                                    <div className="h-16 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                                </div>
                            ) : error ? (
                                <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-center">
                                    <p className="text-xs sm:text-sm text-danger">{error}</p>
                                </div>
                            ) : health ? (
                                <>
                                    {/* Score Card */}
                                    <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${statusConfig[health.status].bg} ${statusConfig[health.status].border}`}>
                                        <div className="space-y-1">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig[health.status].text} bg-white/50 dark:bg-black/20`}>
                                                {health.status}
                                            </span>
                                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed pt-1">
                                                {health.summary}
                                            </p>
                                        </div>

                                        <div className="text-center shrink-0 pl-2">
                                            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                                                {health.healthScore}
                                            </span>
                                            <span className="text-xs text-slate-400 block font-medium">/ 100</span>
                                        </div>
                                    </div>

                                    {/* Key Risks */}
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                            <AlertTriangle size={13} className="text-amber-500" />
                                            <span>Key Risks & Bottlenecks</span>
                                        </h3>
                                        <div className="space-y-1.5">
                                            {health.keyRisks.map((risk, index) => (
                                                <div key={index} className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-surface-dark-raised/40 text-xs text-slate-700 dark:text-slate-300">
                                                    • {risk}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recommendations */}
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                            <ShieldCheck size={13} className="text-signal" />
                                            <span>Actionable Recommendations</span>
                                        </h3>
                                        <div className="space-y-1.5">
                                            {health.recommendations.map((rec, index) => (
                                                <div key={index} className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-surface-dark-raised/40 text-xs text-slate-700 dark:text-slate-300">
                                                    • {rec}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default ProjectHealthModal;
