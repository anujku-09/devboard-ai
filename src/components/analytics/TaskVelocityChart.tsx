import { motion } from "framer-motion";
import { CheckCircle2, Clock, ListTodo, TrendingUp } from "lucide-react";
import type { Task } from "../../types/task";

interface TaskVelocityChartProps {
    tasks: Task[];
}

function TaskVelocityChart({ tasks }: TaskVelocityChartProps) {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "Completed").length;
    const inProgress = tasks.filter((t) => t.status === "In Progress").length;
    const todo = tasks.filter((t) => t.status === "Todo").length;

    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    const highPriority = tasks.filter((t) => t.priority === "High").length;
    const mediumPriority = tasks.filter((t) => t.priority === "Medium").length;
    const lowPriority = tasks.filter((t) => t.priority === "Low").length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6 max-w-full overflow-hidden"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-signal/10 p-2 text-signal shrink-0">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Development Velocity</p>
                        <h2 className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-white">
                            Task Execution & Priority Breakdown
                        </h2>
                    </div>
                </div>

                <div className="self-start sm:self-auto flex items-center gap-2 px-2.5 py-1 rounded-full border border-signal/20 bg-signal/10 text-signal text-[11px] sm:text-xs font-semibold">
                    <span>{completionRate}% Completion Rate</span>
                </div>
            </div>

            {/* Status Breakdown Bars */}
            <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>Status Distribution</span>
                    <span>{completed} of {total} completed</span>
                </div>

                <div className="h-3.5 sm:h-4 w-full rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden flex p-0.5 gap-0.5">
                    {total > 0 ? (
                        <>
                            <div
                                style={{ width: `${(completed / total) * 100}%` }}
                                className="h-full bg-signal rounded-l-full transition-all duration-500"
                                title={`Completed: ${completed}`}
                            />
                            <div
                                style={{ width: `${(inProgress / total) * 100}%` }}
                                className="h-full bg-ember transition-all duration-500"
                                title={`In Progress: ${inProgress}`}
                            />
                            <div
                                style={{ width: `${(todo / total) * 100}%` }}
                                className="h-full bg-slate-400 dark:bg-slate-600 rounded-r-full transition-all duration-500"
                                title={`Todo: ${todo}`}
                            />
                        </>
                    ) : (
                        <div className="h-full w-full bg-slate-200 dark:bg-white/10 rounded-full" />
                    )}
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised p-2 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2.5 min-w-0">
                        <span className="p-1 rounded-lg bg-signal/10 text-signal shrink-0 hidden sm:inline-block">
                            <CheckCircle2 size={16} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[9px] sm:text-[10px] uppercase font-semibold text-slate-400 truncate">Completed</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{completed}</p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised p-2 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2.5 min-w-0">
                        <span className="p-1 rounded-lg bg-ember/10 text-ember shrink-0 hidden sm:inline-block">
                            <Clock size={16} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[9px] sm:text-[10px] uppercase font-semibold text-slate-400 truncate">In Progress</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{inProgress}</p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised p-2 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2.5 min-w-0">
                        <span className="p-1 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 shrink-0 hidden sm:inline-block">
                            <ListTodo size={16} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[9px] sm:text-[10px] uppercase font-semibold text-slate-400 truncate">Todo</p>
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{todo}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Priority Matrix */}
            <div className="space-y-2 sm:space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Priority Spread
                </p>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="rounded-xl border border-danger/20 bg-danger/5 p-2 sm:p-3 text-center sm:text-left">
                        <p className="text-[9px] sm:text-xs text-danger font-medium">High</p>
                        <p className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">{highPriority}</p>
                    </div>

                    <div className="rounded-xl border border-ember/20 bg-ember/5 p-2 sm:p-3 text-center sm:text-left">
                        <p className="text-[9px] sm:text-xs text-ember font-medium">Medium</p>
                        <p className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">{mediumPriority}</p>
                    </div>

                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-2 sm:p-3 text-center sm:text-left">
                        <p className="text-[9px] sm:text-xs text-blue-500 font-medium">Low</p>
                        <p className="text-base sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">{lowPriority}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default TaskVelocityChart;
