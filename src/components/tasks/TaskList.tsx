import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import type { Task } from "../../types/task";
import TaskCard from "./TaskCard";

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => Promise<void>;
}

function TaskList({ tasks, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-12 text-center"
      >
        <div className="mx-auto w-fit p-3 rounded-full bg-ember/10 text-ember mb-4">
          <ClipboardList size={24} />
        </div>

        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
          No tasks yet
        </h3>

        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Create your first task to get started.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-6">
      <AnimatePresence>
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
          >
            <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default TaskList;