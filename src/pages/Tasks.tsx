import { useMemo, useState } from "react";
import { Plus, RefreshCw, LayoutGrid, List } from "lucide-react";
import TaskList from "../components/tasks/TaskList";
import KanbanBoard from "../components/tasks/KanbanBoard";
import TaskModal from "../components/tasks/TaskModal";
import { useTasks } from "../hooks/useTasks";
import { useAuth } from "../hooks/useAuth";
import type { Task } from "../types/task";
import type { TaskFormData } from "../schemas/taskSchema";

function Tasks() {
  const { user } = useAuth();
  const { tasks, loading, error, createTask, updateTask, deleteTask, refreshTasks } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const visibleTasks = useMemo(() => {
    return [...tasks].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [tasks]);

  async function handleSubmit(data: TaskFormData) {
    if (selectedTask) {
      await updateTask({ ...selectedTask, ...data, dueDate: data.dueDate ?? null });
    } else {
      await createTask({
        projectId: data.projectId,
        userId: user?.id ?? "local-user",
        title: data.title,
        description: data.description ?? "",
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ?? null,
      });
    }

    setOpen(false);
    setSelectedTask(null);
  }

  async function handleStatusChange(task: Task, newStatus: Task["status"]) {
    await updateTask({
      ...task,
      status: newStatus,
    });
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="h-8 w-40 rounded bg-slate-200/60 dark:bg-white/5 animate-pulse" />
        <div className="h-64 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3.5 sm:space-y-6 max-w-full overflow-hidden">
      {/* Desktop Action Header */}
      <div className="hidden sm:flex items-center justify-between gap-3">
        <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
          All Workspace Tasks ({tasks.length})
        </span>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center p-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-surface-dark-raised">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <LayoutGrid size={14} />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <List size={14} />
              <span>List</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => void refreshTasks()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/10 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedTask(null);
              setOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ember px-3.5 py-1.5 text-xs sm:text-sm font-medium text-ink hover:bg-ember-dark transition-colors"
          >
            <Plus size={14} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Mobile Top Action Bar */}
      <div className="flex sm:hidden items-center justify-between gap-2">
        <div className="flex items-center p-0.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-surface-dark-raised">
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === "kanban"
                ? "bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500"
            }`}
          >
            Board
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === "list"
                ? "bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500"
            }`}
          >
            List
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void refreshTasks()}
            className="p-1.5 rounded-xl border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            title="Refresh tasks"
          >
            <RefreshCw size={14} />
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedTask(null);
              setOpen(true);
            }}
            className="inline-flex items-center gap-1 rounded-xl bg-ember px-3 py-1 text-xs font-semibold text-ink hover:bg-ember-dark transition-colors"
          >
            <Plus size={14} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-4 sm:p-6 text-xs sm:text-sm text-danger">
          {error}
        </div>
      ) : null}

      {viewMode === "kanban" ? (
        <KanbanBoard
          tasks={visibleTasks}
          onEdit={(task) => {
            setSelectedTask(task);
            setOpen(true);
          }}
          onDelete={(task) => deleteTask(task.id)}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <TaskList
          tasks={visibleTasks}
          onEdit={(task) => {
            setSelectedTask(task);
            setOpen(true);
          }}
          onDelete={(task) => deleteTask(task.id)}
        />
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <TaskModal
              initialValues={selectedTask}
              onClose={() => {
                setOpen(false);
                setSelectedTask(null);
              }}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Tasks;
