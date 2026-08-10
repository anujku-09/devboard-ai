import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleDot, GitPullRequest, Link2, Unlink, Edit2, Trash2, ArrowRight, ArrowLeft, CheckCircle2, Clock, ListTodo, ChevronDown, ChevronUp, Folder } from "lucide-react";
import type { Task } from "../../types/task";
import TaskGithubLinkModal from "./TaskGithubLinkModal";
import { useTaskGithubLink } from "../../hooks/useTaskGithubLink";

interface KanbanBoardProps {
    tasks: Task[];
    projectsMap?: Map<string, string>;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => Promise<void>;
    onStatusChange: (task: Task, newStatus: Task["status"]) => Promise<void>;
}

const statusColumns: Array<{
    status: Task["status"];
    title: string;
    icon: typeof ListTodo;
    accent: string;
    border: string;
}> = [
    {
        status: "Todo",
        title: "To Do",
        icon: ListTodo,
        accent: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
        border: "border-slate-500/30",
    },
    {
        status: "In Progress",
        title: "In Progress",
        icon: Clock,
        accent: "bg-ember/10 text-ember",
        border: "border-ember/30",
    },
    {
        status: "Completed",
        title: "Completed",
        icon: CheckCircle2,
        accent: "bg-signal/10 text-signal",
        border: "border-signal/30",
    },
];

const priorityStyles: Record<Task["priority"], string> = {
    Low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    Medium: "bg-ember/10 text-ember border-ember/20",
    High: "bg-danger/10 text-danger border-danger/20",
};

function CollapsibleTaskDescription({ description }: { description: string }) {
    const [expanded, setExpanded] = useState(false);
    const isLong = description.length > 45;

    if (!isLong) {
        return (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-words">
                {description}
            </p>
        );
    }

    return (
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-words">
            {expanded ? description : `${description.slice(0, 45)}... `}
            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    setExpanded(!expanded);
                }}
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-ember hover:underline ml-0.5"
            >
                <span>{expanded ? "View less" : "View more"}</span>
            </button>
        </p>
    );
}

function KanbanCard({
    task,
    projectName,
    onEdit,
    onDelete,
    onStatusChange,
}: {
    task: Task;
    projectName?: string;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => Promise<void>;
    onStatusChange: (task: Task, newStatus: Task["status"]) => Promise<void>;
}) {
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const { link, linkToGithub, unlinkFromGithub } = useTaskGithubLink(task.id);
    const [isUpdating, setIsUpdating] = useState(false);

    async function handleStatusShift(newStatus: Task["status"]) {
        setIsUpdating(true);
        try {
            await onStatusChange(task, newStatus);
        } finally {
            setIsUpdating(false);
        }
    }

    const nextStatus = task.status === "Todo" ? "In Progress" : task.status === "In Progress" ? "Completed" : null;
    const prevStatus = task.status === "Completed" ? "In Progress" : task.status === "In Progress" ? "Todo" : null;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="glass-card p-3.5 sm:p-4 space-y-2.5 w-full max-w-full overflow-hidden"
        >
            {projectName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-surface-dark-raised text-slate-600 dark:text-slate-300 text-[10px] font-semibold border border-slate-200/60 dark:border-white/10 w-fit">
                    <Folder size={10} className="text-ember shrink-0" />
                    <span className="truncate max-w-[140px]">{projectName}</span>
                </span>
            )}

            <div className="flex items-start justify-between gap-2 min-w-0">
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug break-words flex-1 min-w-0">
                    {task.title}
                </h4>
                <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap shrink-0 ${priorityStyles[task.priority]}`}
                >
                    {task.priority}
                </span>
            </div>

            {task.description && (
                <CollapsibleTaskDescription description={task.description} />
            )}

            {/* GitHub Link Badge */}
            <div className="min-w-0">
                {link ? (
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised p-2 text-xs min-w-0">
                        <a
                            href={link.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 min-w-0 font-medium text-slate-700 dark:text-slate-200 hover:text-ember transition-colors truncate"
                        >
                            {link.linkType === "issue" ? (
                                <CircleDot size={13} className="shrink-0 text-signal" />
                            ) : (
                                <GitPullRequest size={13} className="shrink-0 text-signal" />
                            )}
                            <span className="truncate text-xs">
                                #{link.number} {link.title}
                            </span>
                        </a>

                        <button
                            type="button"
                            onClick={() => void unlinkFromGithub()}
                            className="shrink-0 p-1 text-slate-400 hover:text-danger rounded"
                            title="Unlink"
                        >
                            <Unlink size={13} />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setLinkModalOpen(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-ember transition-colors"
                    >
                        <Link2 size={13} />
                        <span>Link to GitHub</span>
                    </button>
                )}
            </div>

            {/* Actions & Intuitive Status Shift Controls */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 min-w-0 flex-wrap">
                    {prevStatus && (
                        <button
                            type="button"
                            onClick={() => void handleStatusShift(prevStatus)}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-medium border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-surface-dark-raised text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50 shrink-0"
                            title={`Move to ${prevStatus}`}
                        >
                            <ArrowLeft size={12} />
                            <span>{prevStatus}</span>
                        </button>
                    )}

                    {nextStatus && (
                        <button
                            type="button"
                            onClick={() => void handleStatusShift(nextStatus)}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-semibold bg-ember/10 text-ember border border-ember/20 hover:bg-ember/20 transition-colors disabled:opacity-50 shrink-0"
                            title={`Move to ${nextStatus}`}
                        >
                            <span>{nextStatus}</span>
                            <ArrowRight size={12} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => onEdit(task)}
                        className="text-xs text-ember hover:underline font-medium flex items-center gap-1"
                    >
                        <Edit2 size={12} />
                        <span>Edit</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => void onDelete(task)}
                        className="text-xs text-danger hover:underline font-medium flex items-center gap-1"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            <TaskGithubLinkModal
                open={linkModalOpen}
                projectId={task.projectId}
                onClose={() => setLinkModalOpen(false)}
                onSelect={linkToGithub}
            />
        </motion.div>
    );
}

function KanbanBoard({ tasks, projectsMap, onEdit, onDelete, onStatusChange }: KanbanBoardProps) {
    const [mobileActiveStatus, setMobileActiveStatus] = useState<Task["status"]>("Todo");
    const [showAllMobileTasks, setShowAllMobileTasks] = useState(false);

    return (
        <div className="w-full max-w-full space-y-4">
            {/* Mobile Column Tabs Switcher */}
            <div className="md:hidden flex p-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-surface-dark-raised gap-1 min-w-0">
                {statusColumns.map((col) => {
                    const count = tasks.filter((t) => t.status === col.status).length;
                    const isActive = mobileActiveStatus === col.status;
                    return (
                        <button
                            key={col.status}
                            type="button"
                            onClick={() => {
                                setMobileActiveStatus(col.status);
                                setShowAllMobileTasks(false);
                            }}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all truncate ${
                                isActive
                                    ? "bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-xs"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                        >
                            <span className="truncate">{col.title}</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200/60 dark:bg-white/10 shrink-0">
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Mobile Single Column View */}
            <div className="md:hidden space-y-3">
                {(() => {
                    const columnTasks = tasks.filter((t) => t.status === mobileActiveStatus);
                    const visibleMobileTasks = showAllMobileTasks ? columnTasks : columnTasks.slice(0, 4);

                    if (columnTasks.length === 0) {
                        return (
                            <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-6 text-center text-xs text-slate-400">
                                No tasks in {mobileActiveStatus.toLowerCase()}
                            </div>
                        );
                    }

                    return (
                        <>
                            <AnimatePresence mode="popLayout">
                                {visibleMobileTasks.map((task) => (
                                    <KanbanCard
                                        key={task.id}
                                        task={task}
                                        projectName={projectsMap?.get(task.projectId)}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onStatusChange={onStatusChange}
                                    />
                                ))}
                            </AnimatePresence>

                            {columnTasks.length > 4 && (
                                <div className="pt-2 text-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowAllMobileTasks(!showAllMobileTasks)}
                                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        {showAllMobileTasks ? (
                                            <>
                                                <span>Show Less</span>
                                                <ChevronUp size={14} />
                                            </>
                                        ) : (
                                            <>
                                                <span>Show {columnTasks.length - 4} More Tasks</span>
                                                <ChevronDown size={14} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>

            {/* Desktop 3-Column Grid View */}
            <div className="hidden md:grid md:grid-cols-3 gap-6 items-start">
                {statusColumns.map((col) => {
                    const columnTasks = tasks.filter((t) => t.status === col.status);
                    const Icon = col.icon;

                    return (
                        <div key={col.status} className="space-y-4">
                            {/* Column Header */}
                            <div
                                className={`flex items-center justify-between rounded-xl border p-3 bg-white/60 dark:bg-surface-dark/60 backdrop-blur-md ${col.border}`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`p-1.5 rounded-lg ${col.accent}`}>
                                        <Icon size={16} />
                                    </span>
                                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                                        {col.title}
                                    </h3>
                                </div>

                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                                    {columnTasks.length}
                                </span>
                            </div>

                            {/* Column Cards */}
                            <div className="space-y-3 min-h-250">
                                <AnimatePresence mode="popLayout">
                                    {columnTasks.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-6 text-center text-xs text-slate-400"
                                        >
                                            No tasks in {col.title.toLowerCase()}
                                        </motion.div>
                                    ) : (
                                        columnTasks.map((task) => (
                                            <KanbanCard
                                                key={task.id}
                                                task={task}
                                                projectName={projectsMap?.get(task.projectId)}
                                                onEdit={onEdit}
                                                onDelete={onDelete}
                                                onStatusChange={onStatusChange}
                                            />
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default KanbanBoard;
