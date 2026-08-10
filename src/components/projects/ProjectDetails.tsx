import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ArrowLeft, ClipboardList, ExternalLink, GitBranch, GitCommit, HeartPulse, Lock, Sparkles, Unlink, ChevronDown, ChevronUp } from "lucide-react";

import ProgressBar from "../dashboard/ProgressBar";
import RepositoryPickerModal from "./RepositoryPickerModal";
import ProjectBreakdownModal from "./ProjectBreakdownModal";
import AiTaskSuggestionModal from "./AiTaskSuggestionModal";
import ProjectHealthModal from "./ProjectHealthModal";
import CollaboratorAvatarStack from "./CollaboratorAvatarStack";
import { getProjectById } from "../../services/projectService";
import { getTasks } from "../../services/taskService";
import { useRepositoryConnection } from "../../hooks/useRepositoryConnection";
import type { Project } from "../../types/project";
import type { Task } from "../../types/task";

const statusStyles: Record<Project["status"], string> = {
  Completed: "bg-signal/10 text-signal",
  Active: "bg-ember/10 text-ember",
  "On Hold": "bg-danger/10 text-danger",
};

const taskStatusPills: Record<Task["status"], string> = {
  Todo: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
  "In Progress": "bg-ember/10 text-ember",
  Completed: "bg-signal/10 text-signal",
};

function ProjectTaskRow({ task }: { task: Task }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.li
      layout
      className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised p-3 sm:p-3.5 space-y-2 transition-colors hover:border-slate-300 dark:hover:border-white/20"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-snug break-words">
            {task.title}
          </p>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 sm:hidden ${taskStatusPills[task.status]}`}>
            {task.status}
          </span>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <span className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${taskStatusPills[task.status]}`}>
            {task.status}
          </span>

          {task.description ? (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-ember hover:underline shrink-0"
            >
              <span>{expanded ? "Hide details" : "View details"}</span>
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {expanded && task.description && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="pt-2 border-t border-slate-200/60 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-words space-y-1"
          >
            <p>{task.description}</p>
            {task.dueDate && (
              <p className="text-[10px] font-mono text-slate-400">
                Due: {task.dueDate}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

function ProjectDetails() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repoPickerOpen, setRepoPickerOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [healthModalOpen, setHealthModalOpen] = useState(false);

  const [showAllProjectTasks, setShowAllProjectTasks] = useState(false);

  const {
    connection: repoConnection,
    loading: repoLoading,
    error: repoError,
    connect: connectRepository,
    disconnect: disconnectRepository,
  } = useRepositoryConnection(projectId);

  useEffect(() => {
    async function loadProjectDetails() {
      if (!projectId) {
        setError("Project ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [projectData, allTasks] = await Promise.all([
          getProjectById(projectId),
          getTasks(),
        ]);

        setProject(projectData);
        setTasks(allTasks.filter((task) => task.projectId === projectId));
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unable to load project details.");
      } finally {
        setLoading(false);
      }
    }

    void loadProjectDetails();
  }, [projectId]);

  const completedTasks = tasks.filter((task) => task.status === "Completed").length;
  const totalTasks = tasks.length;
  const taskProgress = totalTasks === 0 ? project?.progress ?? 0 : Math.round((completedTasks / totalTasks) * 100);

  const visibleProjectTasks = showAllProjectTasks ? tasks : tasks.slice(0, 4);

  const activityItems = useMemo(() => {
    const items = [] as Array<{ title: string; description: string }>;

    if (project) {
      items.push({
        title: "Project status",
        description: `${project.name} is currently ${project.status.toLowerCase()}.`,
      });
    }

    if (totalTasks > 0) {
      items.push({
        title: "Task snapshot",
        description: `${completedTasks} of ${totalTasks} tasks are completed.`,
      });
    }

    const nextTask = tasks.find((task) => task.status !== "Completed");
    if (nextTask) {
      items.push({
        title: "Next up",
        description: `${nextTask.title} is currently ${nextTask.status.toLowerCase()}.`,
      });
    }

    return items;
  }, [completedTasks, project, tasks, totalTasks]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 rounded bg-slate-200/60 dark:bg-white/5 animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="h-64 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-6 sm:p-8 text-center">
        <p className="text-danger font-medium text-xs sm:text-sm">{error ?? "Project not found."}</p>
        <Link to="/projects" className="mt-4 inline-flex items-center text-xs sm:text-sm text-ember hover:underline">
          <ArrowLeft size={16} className="mr-2" />
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Project Top Action Bar */}
      <div className="space-y-2.5 sm:space-y-3 min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <Link
            to="/projects"
            className="inline-flex md:hidden items-center text-xs font-semibold text-ember hover:underline shrink-0"
          >
            <ArrowLeft size={14} className="mr-1" />
            <span>Projects</span>
          </Link>

          <h1 className="font-display text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight break-words flex-1 min-w-0">
            {project.name}
          </h1>

          <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold shrink-0 ${statusStyles[project.status]}`}>
            {project.status}
          </span>
        </div>

        {project.description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed break-words">
            {project.description}
          </p>
        )}

        {/* AI Actions Scrollable Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-0.5 min-w-0">
          <button
            type="button"
            onClick={() => setHealthModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-signal/30 bg-signal/10 text-signal text-xs font-medium hover:bg-signal/20 transition-colors shrink-0"
          >
            <HeartPulse size={14} />
            <span>Health Analysis</span>
          </button>

          <button
            type="button"
            onClick={() => setSuggestionOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-ember/30 bg-ember/10 text-ember text-xs font-medium hover:bg-ember/20 transition-colors shrink-0"
          >
            <Sparkles size={14} />
            <span>What's Next?</span>
          </button>

          <button
            type="button"
            onClick={() => setBreakdownOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ember text-ink text-xs font-medium hover:bg-ember-dark transition-colors shrink-0"
          >
            <Sparkles size={14} />
            <span>AI Breakdown</span>
          </button>

          <CollaboratorAvatarStack project={project} />
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.6fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-4 sm:p-6 shadow-xs min-w-0"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-ember/10 p-2 text-ember shrink-0">
              <ClipboardList size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Project overview</p>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Delivery snapshot</h2>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised p-2.5 sm:p-4 text-center sm:text-left">
              <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Progress</p>
              <p className="mt-1 text-base sm:text-2xl font-bold text-slate-900 dark:text-white">{taskProgress}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised p-2.5 sm:p-4 text-center sm:text-left">
              <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Tasks</p>
              <p className="mt-1 text-base sm:text-2xl font-bold text-slate-900 dark:text-white">{totalTasks}</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised p-2.5 sm:p-4 text-center sm:text-left">
              <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Completed</p>
              <p className="mt-1 text-base sm:text-2xl font-bold text-slate-900 dark:text-white">{completedTasks}</p>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <span>Completed vs total tasks</span>
              <span className="font-semibold">{taskProgress}%</span>
            </div>
            <ProgressBar value={taskProgress} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-4 sm:p-6 shadow-xs min-w-0"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-signal/10 p-2 text-signal shrink-0">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Activity feed</p>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Recent updates</h2>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {activityItems.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised p-3 space-y-0.5">
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Project Tasks Card with View Details Collapsible Items */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-4 sm:p-6 shadow-xs min-w-0"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Tasks</p>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Project tasks</h2>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
            {completedTasks}/{totalTasks} done
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-5 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            No tasks are linked to this project yet.
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            <ul className="space-y-2">
              <AnimatePresence mode="popLayout">
                {visibleProjectTasks.map((task) => (
                  <ProjectTaskRow key={task.id} task={task} />
                ))}
              </AnimatePresence>
            </ul>

            {tasks.length > 4 && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllProjectTasks(!showAllProjectTasks)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  {showAllProjectTasks ? (
                    <>
                      <span>Show Less</span>
                      <ChevronUp size={14} />
                    </>
                  ) : (
                    <>
                      <span>Show {tasks.length - 4} More Tasks</span>
                      <ChevronDown size={14} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Repository Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-4 sm:p-6 shadow-xs min-w-0"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-ember/10 p-2 text-ember shrink-0">
            <GitBranch size={20} />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Developer integration</p>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Repository</h2>
          </div>
        </div>

        <div className="mt-4">
          {repoLoading ? (
            <div className="h-16 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
          ) : repoConnection ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 p-4 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="p-2 rounded-xl bg-signal/10 text-signal shrink-0">
                  <GitBranch size={18} />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate flex items-center gap-1.5">
                    {repoConnection.fullName}
                    {repoConnection.private && (
                      <Lock size={12} className="text-slate-400 shrink-0" />
                    )}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Default branch: {repoConnection.defaultBranch}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  to={`/projects/${projectId}/repository`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ember text-ink text-xs sm:text-sm font-medium hover:bg-ember-dark transition-colors"
                >
                  <GitCommit size={15} />
                  <span>Dashboard</span>
                </Link>

                <a
                  href={repoConnection.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <ExternalLink size={15} />
                  <span>Open</span>
                </a>

                <button
                  type="button"
                  onClick={() => void disconnectRepository()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <Unlink size={15} />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 p-4 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 shrink-0">
                  <GitBranch size={18} />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                    No repository connected
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                    Link a GitHub repo to see commits, pull requests, and issues here.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRepoPickerOpen(true)}
                className="inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2 rounded-xl bg-ember text-ink text-xs sm:text-sm font-medium hover:bg-ember-dark transition-colors w-full sm:w-auto"
              >
                Connect Repository
              </button>
            </div>
          )}

          {repoError && (
            <p className="text-xs sm:text-sm text-danger mt-3">{repoError}</p>
          )}
        </div>
      </motion.div>

      <RepositoryPickerModal
        open={repoPickerOpen}
        onClose={() => setRepoPickerOpen(false)}
        onSelect={connectRepository}
      />

      <ProjectBreakdownModal
        open={breakdownOpen}
        project={project}
        onClose={() => setBreakdownOpen(false)}
        onTasksCreated={(newTasks) => setTasks((prev) => [...prev, ...newTasks])}
      />

      <AiTaskSuggestionModal
        open={suggestionOpen}
        project={project}
        tasks={tasks}
        onClose={() => setSuggestionOpen(false)}
        onTaskUpdated={(updated) => setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))}
      />

      <ProjectHealthModal
        open={healthModalOpen}
        project={project}
        tasks={tasks}
        repoConnected={Boolean(repoConnection)}
        onClose={() => setHealthModalOpen(false)}
      />
    </div>
  );
}

export default ProjectDetails;