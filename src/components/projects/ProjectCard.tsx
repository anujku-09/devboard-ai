import { useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Project } from "../../types/project";
import ProgressBar from "../dashboard/ProgressBar";
import CollaboratorAvatarStack from "./CollaboratorAvatarStack";
import { useTasks } from "../../hooks/useTasks";
import { calculateProjectProgress } from "../../utils/projectProgress";

interface ProjectCardProps {
    project: Project;
    onEdit: (project: Project) => void;
    onDelete: (project: Project) => Promise<void>;
}

const statusStyles: Record<Project["status"], string> = {
    Completed: "bg-signal/10 text-signal",
    Active: "bg-ember/10 text-ember",
    "On Hold": "bg-danger/10 text-danger",
};

function ProjectCard({
    project,
    onEdit,
    onDelete,
}: ProjectCardProps) {
    const navigate = useNavigate();
    const { tasks } = useTasks();
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const calculated = calculateProjectProgress(tasks, project.id, project.progress);

    async function handleConfirmDelete(event: MouseEvent<HTMLButtonElement>) {
        event.stopPropagation();
        setIsDeleting(true);

        try {
            await onDelete(project);
        } catch {
            setConfirmingDelete(false);
            setIsDeleting(false);
        }
    }

    function handleEdit(event: MouseEvent<HTMLButtonElement>) {
        event.stopPropagation();
        onEdit(project);
    }

    function handleDeleteClick(event: MouseEvent<HTMLButtonElement>) {
        event.stopPropagation();
        setConfirmingDelete(true);
    }

    function handleOpenProject() {
        navigate(`/projects/${project.id}`);
    }

    return (
        <motion.div
            layout
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="group cursor-pointer glass-card p-3.5 sm:p-6 hover:border-ember/40 dark:hover:border-white/20 transition-all duration-300 shadow-xs min-w-0 flex flex-col justify-between"
            onClick={handleOpenProject}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleOpenProject();
                }
            }}
        >
            <div>
                <div className="flex justify-between items-start gap-3 min-w-0">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-xl font-semibold text-slate-900 dark:text-white truncate group-hover:text-ember transition-colors">
                            {project.name}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm line-clamp-2 leading-relaxed break-words">
                            {project.description}
                        </p>
                    </div>
                    <span
                        className={`shrink-0 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${statusStyles[project.status]}`}
                    >
                        {project.status}
                    </span>
                </div>

                <div className="mt-4 sm:mt-6">
                    <div className="flex justify-between items-center mb-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <span>Progress</span>
                        <span className="font-mono text-xs flex items-center gap-1.5">
                            <span>{calculated.progress}%</span>
                            {calculated.totalCount > 0 && (
                                <span className="text-[11px] text-slate-400 font-normal">
                                    ({calculated.completedCount}/{calculated.totalCount} tasks)
                                </span>
                            )}
                        </span>
                    </div>
                    <ProgressBar value={calculated.progress} />
                </div>
            </div>

            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 min-w-0">
                <div onClick={(e) => e.stopPropagation()}>
                    <CollaboratorAvatarStack project={project} maxVisible={2} />
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    {confirmingDelete ? (
                        <>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setConfirmingDelete(false);
                                }}
                                disabled={isDeleting}
                                className="text-xs font-medium px-2 py-1 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="text-xs font-medium px-2 py-1 bg-danger text-white rounded-lg disabled:opacity-50 hover:bg-danger/90 transition-colors"
                            >
                                {isDeleting ? "Deleting..." : "Confirm"}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={handleEdit}
                                className="text-xs font-medium text-ember hover:text-ember-dark transition-colors"
                            >
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteClick}
                                className="text-xs font-medium text-danger hover:text-danger/80 transition-colors"
                            >
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default ProjectCard;
