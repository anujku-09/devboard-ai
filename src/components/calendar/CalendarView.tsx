import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Folder, CheckCircle2, Clock, ListTodo, Calendar as CalendarIcon, Edit2 } from "lucide-react";
import type { Task } from "../../types/task";

interface CalendarViewProps {
  tasks: Task[];
  projectsMap?: Map<string, string>;
  onSelectDate: (dateStr: string) => void;
  onEditTask: (task: Task) => void;
}

const priorityPillStyles: Record<Task["priority"], string> = {
  Low: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20",
  Medium: "bg-ember/10 text-ember border-ember/20 hover:bg-ember/20",
  High: "bg-danger/10 text-danger border-danger/20 hover:bg-danger/20",
};

const priorityDotStyles: Record<Task["priority"], string> = {
  Low: "bg-blue-500",
  Medium: "bg-ember",
  High: "bg-danger",
};

const statusIcons: Record<Task["status"], typeof ListTodo> = {
  Todo: ListTodo,
  "In Progress": Clock,
  Completed: CheckCircle2,
};

const DAYS_OF_WEEK_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
const DAYS_OF_WEEK_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function CalendarView({ tasks, projectsMap, onSelectDate, onEditTask }: CalendarViewProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedMobileDate, setSelectedMobileDate] = useState<string>(
    formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const todayStr = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  // Group tasks by dueDate (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      if (t.dueDate) {
        const existing = map.get(t.dueDate) || [];
        existing.push(t);
        map.set(t.dueDate, existing);
      }
    });
    return map;
  }, [tasks]);

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [] as Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
    }>;

    // Previous month padding days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      days.push({
        dateStr: formatDateKey(prevYear, prevMonth, pDay),
        dayNumber: pDay,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      days.push({
        dateStr: formatDateKey(year, month, d),
        dayNumber: d,
        isCurrentMonth: true,
      });
    }

    // Next month padding days to complete 35 or 42 grid slots
    const totalSlots = days.length > 35 ? 42 : 35;
    const remainingSlots = totalSlots - days.length;
    for (let n = 1; n <= remainingSlots; n++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      days.push({
        dateStr: formatDateKey(nextYear, nextMonth, n),
        dayNumber: n,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  function handlePrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function handleNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function handleToday() {
    const freshToday = new Date();
    setCurrentDate(new Date(freshToday.getFullYear(), freshToday.getMonth(), 1));
    setSelectedMobileDate(formatDateKey(freshToday.getFullYear(), freshToday.getMonth(), freshToday.getDate()));
  }

  const selectedDayTasks = tasksByDate.get(selectedMobileDate) || [];

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Calendar Header Controls */}
      <div className="flex items-center justify-between gap-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <h2 className="font-display text-base sm:text-xl font-bold text-slate-900 dark:text-white truncate">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button
            type="button"
            onClick={handleToday}
            className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shrink-0"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 sm:p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 sm:p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
        {DAYS_OF_WEEK_FULL.map((day, idx) => (
          <div key={day} className="py-0.5">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{DAYS_OF_WEEK_SHORT[idx]}</span>
          </div>
        ))}
      </div>

      {/* 7-Column Grid Matrix */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarDays.map((cell) => {
          const dayTasks = tasksByDate.get(cell.dateStr) || [];
          const isToday = cell.dateStr === todayStr;
          const isSelected = cell.dateStr === selectedMobileDate;

          return (
            <motion.div
              key={cell.dateStr}
              layout
              onClick={() => setSelectedMobileDate(cell.dateStr)}
              className={`group min-h-[58px] sm:min-h-[110px] p-1 sm:p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all overflow-hidden ${
                cell.isCurrentMonth
                  ? "bg-white dark:bg-surface-dark border-slate-200 dark:border-white/10 hover:border-ember/40"
                  : "bg-slate-50/50 dark:bg-surface-dark-raised/30 border-slate-200/50 dark:border-white/5 text-slate-400 opacity-60"
              } ${isToday ? "ring-2 ring-ember bg-ember/5 dark:bg-ember/10" : ""} ${
                isSelected ? "border-ember dark:border-ember shadow-xs" : ""
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-[10px] sm:text-xs font-bold font-mono h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center ${
                    isToday
                      ? "bg-ember text-ink"
                      : cell.isCurrentMonth
                      ? "text-slate-800 dark:text-slate-200"
                      : "text-slate-400"
                  }`}
                >
                  {cell.dayNumber}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDate(cell.dateStr);
                  }}
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-0.5 sm:p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-ember transition-all"
                  title={`Add task for ${cell.dateStr}`}
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Day Tasks List (Desktop & Tablet) */}
              <div className="hidden sm:block space-y-1 my-1 overflow-y-auto max-h-[70px] no-scrollbar">
                {dayTasks.map((t) => {
                  const Icon = statusIcons[t.status];
                  const projectName = projectsMap?.get(t.projectId);
                  const isPastDue = t.status !== "Completed" && cell.dateStr < todayStr;

                  return (
                    <div
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(t);
                      }}
                      className={`cursor-pointer rounded-md p-1 border text-[10px] sm:text-xs font-medium flex items-center justify-between gap-1 transition-all ${
                        isPastDue
                          ? "bg-danger/10 text-danger border-danger/30 ring-1 ring-danger/30"
                          : priorityPillStyles[t.priority]
                      }`}
                      title={`${t.title} (${t.status})`}
                    >
                      <div className="flex items-center gap-1 truncate min-w-0">
                        <Icon size={11} className="shrink-0" />
                        <span className="truncate">{t.title}</span>
                      </div>
                      {projectName && (
                        <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] opacity-70 shrink-0">
                          <Folder size={8} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mobile Indicator Dots (Phone View) */}
              <div className="sm:hidden flex items-center justify-center gap-0.5 my-0.5 flex-wrap max-h-[16px] overflow-hidden">
                {dayTasks.slice(0, 3).map((t) => (
                  <span
                    key={t.id}
                    className={`h-1.5 w-1.5 rounded-full ${priorityDotStyles[t.priority]}`}
                  />
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-[8px] text-slate-400 font-mono">+</span>
                )}
              </div>

              {/* Task Count Footer */}
              {dayTasks.length > 0 && (
                <span className="text-[8px] sm:text-[9px] font-mono text-slate-400 text-right shrink-0 truncate">
                  {dayTasks.length} <span className="hidden sm:inline">task{dayTasks.length > 1 ? "s" : ""}</span>
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Selected Mobile Date Agenda Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedMobileDate}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-xs"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <CalendarIcon size={16} className="text-ember shrink-0" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                Agenda for {selectedMobileDate} ({selectedDayTasks.length})
              </h3>
            </div>

            <button
              type="button"
              onClick={() => onSelectDate(selectedMobileDate)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-ember/10 text-ember hover:bg-ember/20 text-xs font-semibold transition-colors shrink-0"
            >
              <Plus size={13} />
              <span>Add Task</span>
            </button>
          </div>

          {selectedDayTasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              No tasks scheduled for this date. Click <span className="font-semibold text-ember">+ Add Task</span> to create one!
            </p>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {selectedDayTasks.map((t) => {
                const Icon = statusIcons[t.status];
                const projectName = projectsMap?.get(t.projectId);
                const isPastDue = t.status !== "Completed" && selectedMobileDate < todayStr;

                return (
                  <div
                    key={t.id}
                    onClick={() => onEditTask(t)}
                    className="cursor-pointer p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-surface-dark-raised/50 hover:border-ember/40 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Icon size={14} className={isPastDue ? "text-danger shrink-0" : "text-ember shrink-0"} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {t.title}
                        </p>
                        {projectName && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                            <Folder size={10} className="text-ember shrink-0" />
                            <span className="truncate">{projectName}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${priorityPillStyles[t.priority]}`}>
                        {t.priority}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTask(t);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-ember hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default CalendarView;
