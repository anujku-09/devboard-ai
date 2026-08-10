import type { Task } from "../../types/task";

const statusStyles: Record<Task["status"], string> = {
    Todo: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
    "In Progress": "bg-signal/10 text-signal",
    Completed: "bg-ember/10 text-ember",
};

interface TaskItemProps {
    task: Task;
}

function TaskItem({ task }: TaskItemProps) {
    return (
        <div className="flex items-center justify-between gap-3 py-3 border-b border-slate-100 dark:border-white/5 last:border-b-0 min-w-0">
            <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm truncate">
                    {task.title}
                </p>
                {task.dueDate && (
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                )}
            </div>

            <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap shrink-0 ${statusStyles[task.status]}`}
            >
                {task.status}
            </span>
        </div>
    );
}

export default TaskItem;
