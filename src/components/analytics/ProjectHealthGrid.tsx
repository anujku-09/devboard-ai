import { motion } from "framer-motion";
import { FolderGit2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Project } from "../../types/project";
import ProgressBar from "../dashboard/ProgressBar";
import { useTasks } from "../../hooks/useTasks";
import { calculateProjectProgress } from "../../utils/projectProgress";

interface ProjectHealthGridProps {
    projects: Project[];
}

const statusStyles: Record<Project["status"], string> = {
    Completed: "bg-signal/10 text-signal",
    Active: "bg-ember/10 text-ember",
    "On Hold": "bg-danger/10 text-danger",
};

function ProjectHealthGrid({ projects }: ProjectHealthGridProps) {
    const { tasks } = useTasks();

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-4 sm:p-6 shadow-sm space-y-4 max-w-full overflow-hidden"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-blue-500/10 p-2 text-blue-500 shrink-0">
                        <FolderGit2 size={20} />
                    </div>
                    <div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Multi-Project Delivery</p>
                        <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                            Project Delivery Matrix
                        </h2>
                    </div>
                </div>

                <span className="self-start sm:self-auto text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {projects.length} Active Projects
                </span>
            </div>

            {projects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-6 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    No projects found. Create a project to see delivery health metrics.
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {projects.map((project) => {
                        const calculated = calculateProjectProgress(tasks, project.id, project.progress);
                        return (
                            <div
                                key={project.id}
                                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised p-4 space-y-3 min-w-0"
                            >
                                <div className="flex items-start justify-between gap-2 min-w-0">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                                            {project.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                            {project.description || "No description"}
                                        </p>
                                    </div>

                                    <span
                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${statusStyles[project.status]}`}
                                    >
                                        {project.status}
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300 font-medium">
                                        <span>Progress</span>
                                        <span className="font-mono text-xs flex items-center gap-1">
                                            <span>{calculated.progress}%</span>
                                            {calculated.totalCount > 0 && (
                                                <span className="text-[10px] text-slate-400 font-normal">
                                                    ({calculated.completedCount}/{calculated.totalCount})
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <ProgressBar value={calculated.progress} />
                                </div>

                                <div className="pt-1 flex justify-end">
                                    <Link
                                        to={`/projects/${project.id}`}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-ember hover:underline"
                                    >
                                        <span>View Hub</span>
                                        <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}

export default ProjectHealthGrid;
