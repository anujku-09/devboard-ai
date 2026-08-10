import { useMemo, useState } from "react";
import { Filter, Calendar as CalendarIcon, Clock, Plus, Folder } from "lucide-react";
import CalendarView from "../components/calendar/CalendarView";
import TaskModal from "../components/tasks/TaskModal";
import { useTasks } from "../hooks/useTasks";
import { useProjects } from "../hooks/useProjects";
import { useAuth } from "../hooks/useAuth";
import type { Task } from "../types/task";
import type { TaskFormData } from "../schemas/taskSchema";

function Calendar() {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading, createTask, updateTask, refreshTasks } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();

  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialDueDate, setInitialDueDate] = useState<string | null>(null);

  const projectsMap = useMemo(() => {
    return new Map(projects.map((p) => [p.id, p.name]));
  }, [projects]);

  const visibleTasks = useMemo(() => {
    if (selectedProjectId === "all") return tasks;
    return tasks.filter((t) => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  // Upcoming 7 Days Deadlines
  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    return visibleTasks
      .filter((t) => {
        if (!t.dueDate || t.status === "Completed") return false;
        const due = new Date(t.dueDate);
        return due >= today && due <= sevenDaysLater;
      })
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [visibleTasks]);

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

    setModalOpen(false);
    setSelectedTask(null);
    setInitialDueDate(null);
    void refreshTasks();
  }

  function handleSelectDate(dateStr: string) {
    setSelectedTask(null);
    setInitialDueDate(dateStr);
    setModalOpen(true);
  }

  function handleEditTask(task: Task) {
    setSelectedTask(task);
    setInitialDueDate(null);
    setModalOpen(true);
  }

  const isLoading = tasksLoading || projectsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-slate-200/60 dark:bg-white/5 animate-pulse" />
        <div className="h-96 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3.5 sm:space-y-6 max-w-full overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-ember/10 text-ember shrink-0">
            <CalendarIcon size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-base sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
              Calendar & Timeline
            </h1>
            <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Visualize task deadlines, project milestones, and upcoming deliverables.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-surface-dark-raised flex-1 sm:flex-none min-w-0">
            <Filter size={13} className="text-ember shrink-0" />
            <select
              aria-label="Filter calendar by project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer w-full sm:max-w-[160px] truncate"
            >
              <option value="all" className="bg-white dark:bg-surface-dark text-slate-800 dark:text-slate-200">
                All Projects ({projects.length})
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-surface-dark text-slate-800 dark:text-slate-200">
                  📁 {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedTask(null);
              setInitialDueDate(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-ember px-3 py-1.5 sm:px-3.5 text-xs sm:text-sm font-medium text-ink hover:bg-ember-dark transition-colors shrink-0 shadow-xs"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Add Task</span>
            <span className="sm:hidden">Task</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar View + Side Deadlines Widget */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_280px] items-start">
        <CalendarView
          tasks={visibleTasks}
          projectsMap={projectsMap}
          onSelectDate={handleSelectDate}
          onEditTask={handleEditTask}
        />

        {/* Side Upcoming Deadlines Panel */}
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
            <Clock size={15} className="text-ember shrink-0" />
            <h3 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
              Next 7 Days ({upcomingDeadlines.length})
            </h3>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              No deadlines in the next 7 days.
            </p>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {upcomingDeadlines.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleEditTask(t)}
                  className="cursor-pointer p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-surface-dark-raised/50 hover:border-ember/40 transition-colors space-y-1"
                >
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug break-words line-clamp-2">
                    {t.title}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                    <span>Due: {t.dueDate}</span>
                    {projectsMap?.get(t.projectId) && (
                      <span className="flex items-center gap-0.5 truncate max-w-[110px]">
                        <Folder size={9} className="text-ember shrink-0" />
                        <span className="truncate">{projectsMap.get(t.projectId)}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Creation / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <TaskModal
              initialValues={
                selectedTask
                  ? selectedTask
                  : initialDueDate
                  ? { dueDate: initialDueDate }
                  : undefined
              }
              onClose={() => {
                setModalOpen(false);
                setSelectedTask(null);
                setInitialDueDate(null);
              }}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;
