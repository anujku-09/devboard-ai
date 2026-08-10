import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";

import ActivityItem from "./ActivityItem";
import { useProjects } from "../../hooks/useProjects";
import { useTasks } from "../../hooks/useTasks";
import { buildActivityFeed } from "../../utils/activity";

type FeedFilter = "all" | "projects" | "tasks";

function ActivityFeed() {
    const { projects, loading: projectsLoading } = useProjects();
    const { tasks, loading: tasksLoading } = useTasks();

    const [filter, setFilter] = useState<FeedFilter>("all");
    const [expanded, setExpanded] = useState(false);

    const loading = projectsLoading || tasksLoading;
    const allEntries = useMemo(() => buildActivityFeed(projects, tasks), [projects, tasks]);

    const filteredEntries = useMemo(() => {
        if (filter === "projects") {
            return allEntries.filter((e) => e.type === "project_created");
        }
        if (filter === "tasks") {
            return allEntries.filter((e) => e.type === "task_created" || e.type === "task_completed");
        }
        return allEntries;
    }, [allEntries, filter]);

    const visibleEntries = expanded ? filteredEntries : filteredEntries.slice(0, 5);
    const hiddenCount = filteredEntries.length - 5;

    return (
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs p-3.5 sm:p-6 max-w-full overflow-hidden space-y-2.5 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-signal/10 text-signal shrink-0">
                        <Activity size={18} className="sm:w-5 sm:h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Audit Log</p>
                        <h2 className="font-display text-sm sm:text-xl font-semibold text-slate-900 dark:text-white">
                            Activity Feed
                        </h2>
                    </div>
                </div>

                {/* Filter Tabs */}
                {allEntries.length > 0 && (
                    <div className="flex items-center p-0.5 sm:p-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-surface-dark-raised self-start sm:self-auto gap-0.5 sm:gap-1">
                        <button
                            type="button"
                            onClick={() => setFilter("all")}
                            className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold transition-colors ${
                                filter === "all"
                                    ? "bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-xs"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                        >
                            All ({allEntries.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter("projects")}
                            className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold transition-colors ${
                                filter === "projects"
                                    ? "bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-xs"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                        >
                            Projects
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter("tasks")}
                            className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold transition-colors ${
                                filter === "tasks"
                                    ? "bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-xs"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                        >
                            Tasks
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="space-y-2 py-1">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="flex items-start gap-2 sm:gap-3">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse shrink-0" />
                            <div className="flex-1 space-y-1 pt-0.5">
                                <div className="h-3 w-1/3 rounded bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                                <div className="h-2.5 w-1/2 rounded bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-6">
                    <p className="font-medium text-slate-700 dark:text-slate-200 text-xs">
                        No recent activity recorded
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Create a project or task to see live timeline events.
                    </p>
                    <Link
                        to="/projects"
                        className="mt-2 text-xs font-medium text-ember hover:underline"
                    >
                        Go to Projects
                    </Link>
                </div>
            ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                    <AnimatePresence mode="popLayout">
                        {visibleEntries.map((entry, index) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2, delay: index * 0.02 }}
                            >
                                <ActivityItem entry={entry} />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredEntries.length > 5 && (
                        <div className="pt-2 text-center">
                            <button
                                type="button"
                                onClick={() => setExpanded(!expanded)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                            >
                                {expanded ? (
                                    <>
                                        <span>Show Less</span>
                                        <ChevronUp size={12} />
                                    </>
                                ) : (
                                    <>
                                        <span>Show {hiddenCount} More Activities</span>
                                        <ChevronDown size={12} />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ActivityFeed;
