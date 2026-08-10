import { useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, RefreshCw, Trophy, Lightbulb, CheckCircle2, Sparkles } from "lucide-react";

import { useProductivityInsights } from "../../hooks/useProductivityInsights";
import { useGithubConnection } from "../../hooks/useGithubConnection";
import type { Project } from "../../types/project";
import type { Task } from "../../types/task";

const velocityStyles: Record<"Accelerating" | "Steady" | "Blocked" | "Starting Out", string> = {
    Accelerating: "bg-signal/10 text-signal border-signal/20",
    Steady: "bg-ember/10 text-ember border-ember/20",
    Blocked: "bg-danger/10 text-danger border-danger/20",
    "Starting Out": "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

interface AiProductivityCardProps {
    tasks: Task[];
    projects: Project[];
}

function AiProductivityCard({ tasks, projects }: AiProductivityCardProps) {
    const { connection } = useGithubConnection();
    const { insight, loading, error, generate } = useProductivityInsights();

    // Auto-load from 30-min cache on Dashboard mount
    useEffect(() => {
        if (tasks.length > 0 || projects.length > 0) {
            void generate(tasks, projects, connection?.githubUsername, false);
        }
    }, [tasks, projects, connection?.githubUsername, generate]);

    function handleGenerate(forceRefresh: boolean = false) {
        void generate(tasks, projects, connection?.githubUsername, forceRefresh);
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-4 sm:p-6 shadow-sm max-w-full overflow-hidden"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-amber-500/10 p-2 text-amber-500 shrink-0">
                        <Zap size={20} />
                    </div>
                    <div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Developer Coaching</p>
                        <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                            AI Productivity Insights
                        </h2>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => handleGenerate(true)}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-ember transition-colors disabled:opacity-50 w-full sm:w-auto shrink-0"
                    title="Bypass 30-min cache and fetch fresh AI productivity insights"
                >
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    <span>{loading ? "Analyzing..." : "Refresh Insights"}</span>
                </button>
            </div>

            {loading && !insight ? (
                <div className="space-y-3">
                    <div className="h-16 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                    <div className="h-16 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                </div>
            ) : error ? (
                <p className="text-xs text-danger">{error}</p>
            ) : insight ? (
                <div className="space-y-4">
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-surface-dark-raised/40 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${velocityStyles[insight.velocityLevel]}`}>
                                {insight.velocityLevel}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Sparkles size={11} className="text-ember" />
                                Gemini 2.5 Flash
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                            {insight.summary}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/30 dark:bg-surface-dark-raised/20 space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Trophy size={13} className="text-ember" />
                                Key Achievements
                            </h3>
                            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                                {insight.keyAchievements.map((ach, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5">
                                        <CheckCircle2 size={13} className="text-signal shrink-0 mt-0.5" />
                                        <span>{ach}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/30 dark:bg-surface-dark-raised/20 space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Lightbulb size={13} className="text-amber-500" />
                                Optimization Tips
                            </h3>
                            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                                {insight.optimizationTips.map((tip, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5">
                                        <span className="text-amber-500 shrink-0">•</span>
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-4">
                    <button
                        type="button"
                        onClick={() => handleGenerate(false)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ember text-ink text-xs font-semibold hover:bg-ember-dark transition-colors shadow-xs"
                    >
                        <Zap size={14} />
                        <span>Generate Productivity Insights</span>
                    </button>
                </div>
            )}
        </motion.div>
    );
}

export default AiProductivityCard;
