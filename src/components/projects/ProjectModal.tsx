import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { projectSchema, projectStatuses } from "../../schemas/projectSchema";
import type { ProjectFormData } from "../../schemas/projectSchema";

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  initialValues?: ProjectFormData;
}

const emptyValues: ProjectFormData = {
  name: "",
  description: "",
  status: "Active",
  progress: 0,
};

function ProjectModal({
  open,
  onClose,
  onSubmit,
  initialValues,
}: ProjectModalProps) {
  const isEditMode = Boolean(initialValues);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialValues ?? emptyValues,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues ?? emptyValues);
    }
  }, [open, initialValues, reset]);

  async function handleFormSubmit(data: ProjectFormData) {
    await onSubmit(data);
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
            <div className="flex justify-between items-center mb-4 sm:mb-6">
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

            <form
              onSubmit={handleSubmit(handleFormSubmit)}
              className="space-y-3 sm:space-y-4"
            >
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Project Name
                </label>
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
                <label className="block text-xs sm:text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Description
                </label>
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

                  {errors.progress && (
                    <p className="text-danger text-xs mt-1">
                      {errors.progress.message}
                    </p>
                  )}
                </div>
              </div>

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
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-2 bg-ember text-ink font-medium text-xs sm:text-sm rounded-xl hover:bg-ember-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Saving..."
                    : isEditMode
                    ? "Save Changes"
                    : "Create Project"}
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
