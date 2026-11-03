import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Wand2, GitBranch, Loader2, Sparkles } from "lucide-react";
import { taskSchema } from "../../schemas/taskSchema";
import type { TaskFormData } from "../../schemas/taskSchema";
import { useProjects } from "../../hooks/useProjects";
import { getRepositoryConnection } from "../../services/repositoryService";
import { listIssues } from "../../services/githubApiService";
import { generateTaskMetadata, suggestNextTasksBatch } from "../../services/aiService";
import type { GithubIssue, RepositoryConnection } from "../../types/github";
import type { Task } from "../../types/task";

interface TaskModalProps {
  initialValues?: Partial<Task> | null;
  onSubmit: (values: TaskFormData) => Promise<void>;
  onClose: () => void;
}

function TaskModal({ initialValues, onSubmit, onClose }: TaskModalProps) {
  const { projects, loading } = useProjects();

  const [repoConnection, setRepoConnection] = useState<RepositoryConnection | null>(null);
  const [issues, setIssues] = useState<GithubIssue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      projectId: initialValues?.projectId ?? "",
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      status: initialValues?.status ?? "Todo",
      priority: initialValues?.priority ?? "Medium",
      dueDate: initialValues?.dueDate ?? null,
    },
  });

  const selectedProjectId = watch("projectId");
  const currentTitle = watch("title");

  useEffect(() => {
    reset({
      projectId: initialValues?.projectId ?? "",
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      status: initialValues?.status ?? "Todo",
      priority: initialValues?.priority ?? "Medium",
      dueDate: initialValues?.dueDate ?? null,
    });
  }, [initialValues, reset]);

  // When project changes, check if GitHub repository is linked & fetch open issues
  useEffect(() => {
    if (!selectedProjectId) {
      setRepoConnection(null);
      setIssues([]);
      return;
    }

    let isCancelled = false;

    async function checkRepoAndIssues() {
      try {
        const conn = await getRepositoryConnection(selectedProjectId);
        if (isCancelled) return;
        setRepoConnection(conn);

        if (conn?.owner && conn?.name) {
          setIssuesLoading(true);
          const issueList = await listIssues(conn.owner, conn.name);
          if (!isCancelled) {
            setIssues(issueList.filter((i) => i.state === "open"));
          }
        } else {
          setIssues([]);
        }
      } catch (err) {
        console.warn("Could not fetch project repo issues:", err);
        if (!isCancelled) {
          setRepoConnection(null);
          setIssues([]);
        }
      } finally {
        if (!isCancelled) setIssuesLoading(false);
      }
    }

    void checkRepoAndIssues();

    return () => {
      isCancelled = true;
    };
  }, [selectedProjectId]);

  // 1-Click Import from a GitHub Issue
  function handleSelectIssue(issueNumberStr: string) {
    const issueNum = Number(issueNumberStr);
    const issue = issues.find((i) => i.number === issueNum);
    if (!issue) return;

    setValue("title", issue.title, { shouldValidate: true });
    setValue(
      "description",
      issue.body ? issue.body.slice(0, 300) : `Tracked from GitHub issue #${issue.number}`,
      { shouldValidate: true }
    );

    const isHigh = issue.labels.some((l) =>
      ["bug", "critical", "urgent", "high", "security"].some((k) =>
        l.name.toLowerCase().includes(k)
      )
    );
    setValue("priority", isHigh ? "High" : "Medium", { shouldValidate: true });
    setValue("status", "Todo", { shouldValidate: true });

    // Suggest 5-day due date
    const d = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    setValue("dueDate", d.toISOString().split("T")[0], { shouldValidate: true });
  }

  // Magic AI Task Generator: Formats title, writes description, sets priority & due date
  async function handleAiMagicFill() {
    const input = currentTitle.trim() || "Core Feature Implementation";
    const selectedProj = projects.find((p) => p.id === selectedProjectId);

    setAiGenerating(true);
    setAiError(null);

    try {
      const metadata = await generateTaskMetadata(input, selectedProj?.name);
      setValue("title", metadata.title, { shouldValidate: true });
      setValue("description", metadata.description, { shouldValidate: true });
      setValue("priority", metadata.priority, { shouldValidate: true });

      const d = new Date(Date.now() + (metadata.suggestedDueDateDays || 5) * 24 * 60 * 60 * 1000);
      setValue("dueDate", d.toISOString().split("T")[0], { shouldValidate: true });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI generation failed.");
    } finally {
      setAiGenerating(false);
    }
  }

  // AI Suggest Next Task based on selected project context
  async function handleAiSuggestNextTask() {
    const selectedProj = projects.find((p) => p.id === selectedProjectId);
    if (!selectedProj) {
      setAiError("Please select a project first.");
      return;
    }

    setAiGenerating(true);
    setAiError(null);

    try {
      const batch = await suggestNextTasksBatch(
        [],
        selectedProj.name,
        [],
        false,
        1,
        selectedProj.description || "",
        Boolean(repoConnection),
        selectedProj.id
      );

      const topTask = batch.tasks[0];
      if (topTask) {
        setValue("title", topTask.title, { shouldValidate: true });
        setValue("description", topTask.description || topTask.reasoning || "", { shouldValidate: true });
        setValue("priority", topTask.priority, { shouldValidate: true });
        setValue("status", "In Progress", { shouldValidate: true });

        const d = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
        setValue("dueDate", d.toISOString().split("T")[0], { shouldValidate: true });
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to suggest task.");
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleFormSubmit(values: TaskFormData) {
    await onSubmit(values);
    onClose();
  }

  const inputClasses =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 dark:border-white/10 dark:bg-surface-dark-raised dark:text-slate-100";

  if (loading) {
    return <div className="p-4 text-xs sm:text-sm text-slate-500">Loading projects...</div>;
  }

  return (
    <div className="p-1 sm:p-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
            {initialValues ? "Edit Task" : "Add Task"}
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {initialValues ? "Update your task details below." : "Create a task with AI auto-fill or GitHub sync."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs sm:text-sm text-slate-500">
          You need at least one project before creating tasks.
        </div>
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-4 space-y-3 sm:space-y-4">
          {/* Project Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                Project
              </label>

              {/* AI Suggest Next Task Button for Selected Project */}
              {selectedProjectId && !initialValues && (
                <button
                  type="button"
                  onClick={() => void handleAiSuggestNextTask()}
                  disabled={aiGenerating}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-ember hover:underline disabled:opacity-50"
                  title="Analyze project roadmap and suggest the next logical task"
                >
                  <Sparkles size={11} />
                  <span>AI Suggest for Project</span>
                </button>
              )}
            </div>

            <select {...register("projectId")} className={inputClasses}>
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {errors.projectId ? <p className="mt-1 text-xs text-danger">{errors.projectId.message}</p> : null}
          </div>

          {/* GitHub Open Issues 1-Click Import (if repo connected) */}
          {issues.length > 0 && (
            <div className="p-3 rounded-xl border border-ember/30 bg-ember/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <GitBranch size={13} className="text-ember" />
                  <span>Import from GitHub Issue</span>
                </span>
                <span className="text-[10px] text-ember font-medium">1-Click Fill</span>
              </div>

              <select
                onChange={(e) => handleSelectIssue(e.target.value)}
                defaultValue=""
                className="w-full text-xs rounded-xl px-2.5 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                <option value="" disabled>
                  {issuesLoading ? "Loading open GitHub issues..." : "⚡ Select an open GitHub issue to auto-fill..."}
                </option>
                {issues.map((iss) => (
                  <option key={iss.id} value={iss.number}>
                    #{iss.number}: {iss.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title Input + Magic AI Fill Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                Title
              </label>

              <button
                type="button"
                onClick={() => void handleAiMagicFill()}
                disabled={aiGenerating}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
                title="Auto-generate detailed task specification with Gemini AI"
              >
                {aiGenerating ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Wand2 size={12} />
                )}
                <span>{aiGenerating ? "Generating..." : "Magic AI Fill"}</span>
              </button>
            </div>

            <input {...register("title")} className={inputClasses} placeholder="e.g. Implement user authentication" />
            {errors.title ? <p className="mt-1 text-xs text-danger">{errors.title.message}</p> : null}
          </div>

          {/* Description Input */}
          <div>
            <label className="mb-1 block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              rows={3}
              {...register("description")}
              className={inputClasses}
              placeholder="Task details and acceptance criteria..."
            />
          </div>

          {/* Status & Priority Grid */}
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                Status
              </label>
              <select {...register("status")} className={inputClasses}>
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                Priority
              </label>
              <select {...register("priority")} className={inputClasses}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="mb-1 block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              Due Date
            </label>
            <input type="date" {...register("dueDate")} className={inputClasses} />
          </div>

          {aiError && (
            <p className="text-xs text-danger text-center">{aiError}</p>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t border-slate-200 pt-3 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto rounded-xl border border-slate-300 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || aiGenerating}
              className="w-full sm:w-auto rounded-xl bg-ember px-5 py-2 text-xs sm:text-sm font-medium text-ink hover:bg-ember-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? "Saving..." : initialValues ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default TaskModal;
