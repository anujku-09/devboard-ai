import type { ChangeEvent } from "react";
import { Plus } from "lucide-react";

interface TaskToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  priority: string;
  onPriorityChange: (value: string) => void;
  onAddTask: () => void;
}

function TaskToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  onAddTask,
}: TaskToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-4">
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onSearchChange(e.target.value)
        }
        placeholder="Search tasks..."
        className="flex-1 min-w-50 px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ember"
      />

      {/* Status Filter */}
      <select
        value={status}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          onStatusChange(e.target.value)
        }
        className="px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-surface-dark"
      >
        <option value="">All Statuses</option>
        <option value="Todo">Todo</option>
        <option value="In Progress">In Progress</option>
        <option value="Completed">Completed</option>
      </select>

      {/* Priority Filter */}
      <select
        value={priority}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          onPriorityChange(e.target.value)
        }
        className="px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-surface-dark"
      >
        <option value="">All Priorities</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>

      {/* Add Task Button */}
      <button
        type="button"
        onClick={onAddTask}
        className="flex items-center gap-2 px-4 py-2 bg-ember text-white rounded-lg text-sm font-medium hover:bg-ember-dark transition-colors"
      >
        <Plus size={16} />
        Add Task
      </button>
    </div>
  );
}

export default TaskToolbar;
