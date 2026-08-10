import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FolderKanban } from "lucide-react";

import ProjectProgressCard from "./ProjectProgressCard";
import { useProjects } from "../../hooks/useProjects";
import { useTasks } from "../../hooks/useTasks";
import { calculateProjectProgress } from "../../utils/projectProgress";

function ProjectProgress() {
    const { projects, loading: projectsLoading } = useProjects();
    const { tasks, loading: tasksLoading } = useTasks();

    const loading = projectsLoading || tasksLoading;
    const topProjects = projects.slice(0, 5);

    return (
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs p-4 sm:p-6 max-w-full overflow-hidden">
            <h2 className="font-display text-base sm:text-xl font-semibold text-slate-900 dark:text-white mb-3 sm:mb-5">
                Project Progress
            </h2>

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="space-y-2">
                            <div className="h-3 w-1/3 rounded bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                            <div className="h-1.5 w-full rounded-full bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : topProjects.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center text-center py-8"
                >
                    <div className="p-3 rounded-full bg-ember/10 text-ember mb-3">
                        <FolderKanban size={24} />
                    </div>

                    <p className="font-medium text-slate-700 dark:text-slate-200 text-xs sm:text-sm">
                        No projects yet
                    </p>

                    <Link
                        to="/projects"
                        className="mt-3 text-xs sm:text-sm font-medium text-ember hover:underline"
                    >
                        Create your first project
                    </Link>
                </motion.div>
            ) : (
                <div className="space-y-3 sm:space-y-5">
                    {topProjects.map((project, index) => {
                        const calculated = calculateProjectProgress(tasks, project.id, project.progress);
                        return (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.25, delay: index * 0.05 }}
                            >
                                <ProjectProgressCard
                                    title={project.name}
                                    progress={calculated.progress}
                                    taskRatio={calculated.totalCount > 0 ? `(${calculated.completedCount}/${calculated.totalCount})` : undefined}
                                />
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ProjectProgress;
