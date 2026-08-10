import { useState } from "react";
import { motion } from "framer-motion";
import { CircleDot, GitPullRequest, Link2, Unlink, Folder } from "lucide-react";
import type { Task } from "../../types/task";
import TaskGithubLinkModal from "./TaskGithubLinkModal";
import { useTaskGithubLink } from "../../hooks/useTaskGithubLink";

interface TaskCardProps {
  task: Task;
  projectName?: string;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => Promise<void>;
}

const statusStyles: Record<Task["status"], string> = {
  Todo: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20",
  "In Progress": "bg-ember/10 text-ember border border-ember/20",
  Completed: "bg-signal/10 text-signal border border-signal/20",
};

const priorityStyles: Record<Task["priority"], string> = {
  Low: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  Medium: "bg-ember/10 text-ember border border-ember/20",
  High: "bg-danger/10 text-danger border border-danger/20",
};

function CollapsibleTaskDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > 50;

  if (!isLong) {
    return (
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed break-words">
        {description}
      </p>
    );
  }

  return (
    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed break-words">
      {expanded ? description : `${description.slice(0, 50)}... `}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setExpanded(!expanded);
        }}
        className="inline-flex items-center gap-0.5 text-[11px] sm:text-xs font-semibold text-ember hover:underline ml-0.5"
      >
        <span>{expanded ? "View less" : "View more"}</span>
      </button>
    </p>
  );
}

function isOverdue(dueDate: string | null, status: Task["status"]): boolean {
  if (!dueDate || status === "Completed") return false;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function TaskCard({ task, projectName, onEdit, onDelete }: TaskCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const { link, linkToGithub, unlinkFromGithub } = useTaskGithubLink(task.id);

  const overdue = isOverdue(task.dueDate, task.status);

  async function handleConfirmDelete() {
    setIsDeleting(true);
    try {
      await onDelete(task);
    } catch {
      setConfirmingDelete(false);
      setIsDeleting(false);
    }
  }

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs p-4 sm:p-6 w-full max-w-full overflow-hidden space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 min-w-0">
        <div className="min-w-0 flex-1 space-y-1">
          {projectName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-surface-dark-raised text-slate-600 dark:text-slate-300 text-[10px] font-semibold border border-slate-200/60 dark:border-white/10 w-fit mb-1">
              <Folder size={10} className="text-ember shrink-0" />
              <span className="truncate max-w-[140px]">{projectName}</span>
            </span>
          )}
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-snug break-words">
            {task.title}
          </h2>
          {task.description && (
            <CollapsibleTaskDescription description={task.description} />
          )}
          {task.dueDate && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <p
                className={`text-[11px] sm:text-xs font-mono ${
                  overdue ? "text-danger font-semibold" : "text-slate-400"
                }`}
              >
                Due: {task.dueDate}
              </p>
              {overdue && (
                <span className="px-1.5 py-0.2 rounded-md bg-danger/10 text-danger border border-danger/20 text-[10px] font-semibold">
                  Overdue
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 self-start sm:self-auto">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${statusStyles[task.status]}`}
          >
            {task.status}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${priorityStyles[task.priority]}`}
          >
            {task.priority}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        {link ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised p-2.5 text-xs min-w-0">
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
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors"
              aria-label="Unlink from GitHub"
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

      <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-end gap-3">
        {confirmingDelete ? (
          <>
            <span className="text-xs text-slate-500 dark:text-slate-400 mr-auto">
              Delete this task?
            </span>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={isDeleting}
              className="text-xs font-medium px-3 py-1.5 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="text-xs font-medium px-3 py-1.5 bg-danger text-white rounded-lg disabled:opacity-50 hover:bg-danger/90 transition-colors"
            >
              {isDeleting ? "Deleting..." : "Confirm"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="text-xs font-medium text-ember hover:text-ember-dark transition-colors"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="text-xs font-medium text-danger hover:text-danger/80 transition-colors"
            >
              Delete
            </button>
          </>
        )}
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

export default TaskCard;