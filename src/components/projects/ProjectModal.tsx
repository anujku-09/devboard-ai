import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { X, GitBranch, Loader2, Wand2 } from "lucide-react";

import { projectSchema, projectStatuses } from "../../schemas/projectSchema";
import type { ProjectFormData } from "../../schemas/projectSchema";
import { listUserRepositories } from "../../services/githubApiService";
import { generateProjectMetadata } from "../../services/aiService";
import type { GithubRepo } from "../../types/github";

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData, repoToConnect?: GithubRepo | null) => Promise<void>;
  initialValues?: ProjectFormData;
}

const emptyValues: ProjectFormData = {
  name: "",
  description: "",
  status: "Active",
  progress: 0,
};

function formatRepoName(raw: string): string {
  return raw
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function ProjectModal({
  open,
  onClose,
  onSubmit,
  initialValues,
}: ProjectModalProps) {
  const isEditMode = Boolean(initialValues);

  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialValues ?? emptyValues,
  });

  const currentName = watch("name");
  const currentDescription = watch("description");

  // Fetch GitHub repos on open if in Add mode
  useEffect(() => {
    if (!open) {
      setSelectedRepo(null);
      setAiError(null);
      return;
    }

    reset(initialValues ?? emptyValues);
    setSelectedRepo(null);
    setAiError(null);

    if (!isEditMode) {
      setReposLoading(true);
      listUserRepositories()
        .then((data) => setRepos(data))
        .catch(() => setRepos([]))
        .finally(() => setReposLoading(false));
    }
  }, [open, isEditMode, initialValues, reset]);

  // Handle auto-fill when a GitHub repository is selected
  function handleSelectRepo(fullName: string) {
    const repo = repos.find((r) => r.fullName === fullName);
    if (!repo) return;

    setSelectedRepo(repo);
    setValue("name", formatRepoName(repo.name), { shouldValidate: true });
    setValue("description", repo.description || `Developer project repository for ${repo.name}.`, { shouldValidate: true });
    setValue("status", "Active", { shouldValidate: true });
    setValue("progress", 15, { shouldValidate: true });
  }

  // Handle AI Auto-Fill based on name or quick keywords
  async function handleAiAutoFill() {
    const input = currentName.trim() || "New Full Stack Web Project";
    setAiGenerating(true);
    setAiError(null);

    try {
      const generated = await generateProjectMetadata(input, currentDescription);
      setValue("name", generated.name, { shouldValidate: true });
      setValue("description", generated.description, { shouldValidate: true });
      setValue("status", generated.status, { shouldValidate: true });
      setValue("progress", generated.progress, { shouldValidate: true });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI generation failed.");
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleFormSubmit(data: ProjectFormData) {
    await onSubmit(data, selectedRepo);
  }

  const inputClasses =
    "w-full rounded-xl px-3 py-2 sm:py-2.5 border border-slate-300 dark:border-white/10 bg-white dark:bg-surface-dark-raised text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-colors text-xs sm:text-sm";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="font-display text-lg sm:text-2xl font-semibold text-slate-900 dark:text-white">
                {isEditMode ? "Edit Project" : "Add Project"}
              </h2>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* GitHub Fast Import Selector for Zero-Fatigue Onboarding */}
            {!isEditMode && repos.length > 0 && (
              <div className="mb-4 p-3 rounded-xl border border-ember/30 bg-ember/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <GitBranch size={13} className="text-ember" />
                    <span>Import from GitHub</span>
                  </span>
                  <span className="text-[10px] text-ember font-medium">1-Click Auto-Fill</span>
                </div>

                <select
                  value={selectedRepo?.fullName || ""}
                  onChange={(e) => handleSelectRepo(e.target.value)}
                  className="w-full text-xs rounded-xl px-2.5 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark-raised text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                >
                  <option value="">
                    {reposLoading ? "Loading your repositories..." : "⚡ Select a repository to auto-fill..."}
                  </option>
                  {repos.map((repo) => (
                    <option key={repo.id} value={repo.fullName}>
                      {repo.name} {repo.private ? "(Private)" : ""}
                    </option>
                  ))}
                </select>

                {selectedRepo && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    Will auto-link <span className="font-semibold text-ember">{selectedRepo.fullName}</span> and import scope upon creation.
                  </p>
                )}
              </div>
            )}

            <form
              onSubmit={handleSubmit(handleFormSubmit)}
              className="space-y-3 sm:space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Project Name
                  </label>

                  {/* AI Quick Fill Button */}
                  <button
                    type="button"
                    onClick={() => void handleAiAutoFill()}
                    disabled={aiGenerating}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
                    title="Generate project name & description automatically with Gemini AI"
                  >
                    {aiGenerating ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Wand2 size={12} />
                    )}
                    <span>{aiGenerating ? "Generating..." : "Magic AI Fill"}</span>
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="e.g. AI Portfolio Dashboard"
                  className={inputClasses}
                  {...register("name")}
                />

                {errors.name && (
                  <p className="text-danger text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  {selectedRepo && (
                    <span className="text-[10px] text-slate-400">Imported from GitHub</span>
                  )}
                </div>

                <textarea
                  rows={3}
                  placeholder="Describe your project goals..."
                  className={inputClasses}
                  {...register("description")}
                />

                {errors.description && (
                  <p className="text-danger text-xs mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Status
                  </label>

                  <select
                    className={inputClasses}
                    {...register("status")}
                  >
                    {projectStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  {errors.status && (
                    <p className="text-danger text-xs mt-1">
                      {errors.status.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Progress (%)
                  </label>

                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={inputClasses}
                    {...register("progress", { valueAsNumber: true })}
                  />

                  {errors.progress ? (
                    <p className="text-danger text-xs mt-1">
                      {errors.progress.message}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      {isEditMode
                        ? "Automatically synced with task completion."
                        : "Initial baseline; dynamically tracks tasks once created."}
                    </p>
                  )}
                </div>
              </div>

              {aiError && (
                <p className="text-xs text-danger text-center">{aiError}</p>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-200/60 dark:border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-300 dark:border-white/10 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || aiGenerating}
                  className="w-full sm:w-auto px-5 py-2 bg-ember text-ink font-medium text-xs sm:text-sm rounded-xl hover:bg-ember-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : isEditMode ? (
                    "Save Changes"
                  ) : (
                    "Create Project"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ProjectModal;
