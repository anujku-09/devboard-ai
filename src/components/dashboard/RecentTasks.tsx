import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ListTodo } from "lucide-react";

import TaskItem from "./TaskItem";
import { useTasks } from "../../hooks/useTasks";

function RecentTasks() {
    const { tasks, loading } = useTasks();

    const recentTasks = [...tasks]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    return (
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-4 sm:p-6 max-w-full overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="font-display text-base sm:text-xl font-semibold text-slate-900 dark:text-white">
                    Recent Tasks
                </h2>

                {recentTasks.length > 0 && (
                    <Link
                        to="/tasks"
                        className="text-xs sm:text-sm font-medium text-ember hover:underline shrink-0"
                    >
                        View all
                    </Link>
                )}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="h-4 w-1/2 rounded bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                            <div className="h-6 w-20 rounded-full bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : recentTasks.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center text-center py-8 sm:py-10"
                >
                    <div className="p-3 rounded-full bg-ember/10 text-ember mb-3">
                        <ListTodo size={24} />
                    </div>

                    <p className="font-medium text-slate-700 dark:text-slate-200 text-xs sm:text-sm">
                        No tasks yet
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                        Create a task and your most recent ones will show up here.
                    </p>

                    <Link
                        to="/tasks"
                        className="mt-4 text-xs sm:text-sm font-medium text-ember hover:underline"
                    >
                        Go to Tasks
                    </Link>
                </motion.div>
            ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {recentTasks.map((task, index) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.25, delay: index * 0.05 }}
                        >
                            <TaskItem task={task} />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default RecentTasks;
