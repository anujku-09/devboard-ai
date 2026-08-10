import { AnimatePresence, motion } from "framer-motion";
import { FolderPlus } from "lucide-react";
import type { Project } from "../../types/project";
import ProjectCard from "./ProjectCard";

interface ProjectListProps {
    projects: Project[];
    onEdit: (project: Project) => void;
    onDelete: (project: Project) => Promise<void>;
}

function ProjectList({
    projects,
    onEdit,
    onDelete,
}: ProjectListProps) {
    if (projects.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-6 sm:p-12 text-center"
            >
                <div className="mx-auto w-fit p-3 rounded-full bg-ember/10 text-ember mb-3">
                    <FolderPlus size={22} />
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-200">
                    No projects yet
                </h3>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Create your first project to get started.
                </p>
            </motion.div>
        );
    }

    return (
        <div className="grid gap-3 sm:gap-6">
            <AnimatePresence>
                {projects.map((project, index) => (
                    <motion.div
                        key={project.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.25, delay: index * 0.04 }}
                    >
                        <ProjectCard
                            project={project}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

export default ProjectList;