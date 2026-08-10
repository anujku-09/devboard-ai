import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { taskSchema } from "../../schemas/taskSchema";
import type { TaskFormData } from "../../schemas/taskSchema";
import { useProjects } from "../../hooks/useProjects";
import type { Task } from "../../types/task";

interface TaskModalProps {
  initialValues?: Partial<Task> | null;
  onSubmit: (values: TaskFormData) => Promise<void>;
  onClose: () => void;
}

function TaskModal({ initialValues, onSubmit, onClose }: TaskModalProps) {
  const { projects, loading } = useProjects();

  const {
    register,
    handleSubmit,
    reset,
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
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
            {initialValues ? "Edit Task" : "Add Task"}
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {initialValues ? "Update your task details below." : "Create a task and assign it to a project."}
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
          <div>
            <label className="mb-1 block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Project</label>
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

          <div>
            <label className="mb-1 block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
            <input {...register("title")} className={inputClasses} placeholder="Task title" />
            {errors.title ? <p className="mt-1 text-xs text-danger">{errors.title.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea rows={3} {...register("description")} className={inputClasses} placeholder="Task description..." />
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select {...register("status")} className={inputClasses}>
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Priority</label>
              <select {...register("priority")} className={inputClasses}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Due Date</label>
            <input type="date" {...register("dueDate")} className={inputClasses} />
          </div>

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
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-xl bg-ember px-5 py-2 text-xs sm:text-sm font-medium text-ink hover:bg-ember-dark disabled:opacity-50 transition-colors"
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
