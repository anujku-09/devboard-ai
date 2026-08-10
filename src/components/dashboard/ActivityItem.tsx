import { FolderPlus, ListPlus, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { ActivityEntry } from "../../utils/activity";
import { formatRelativeTime } from "../../utils/time";

const activityConfig: Record<ActivityEntry["type"], { icon: LucideIcon; accent: string }> = {
    project_created: {
        icon: FolderPlus,
        accent: "bg-ember/10 text-ember",
    },
    task_created: {
        icon: ListPlus,
        accent: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
    },
    task_completed: {
        icon: CheckCircle2,
        accent: "bg-signal/10 text-signal",
    },
};

interface ActivityItemProps {
    entry: ActivityEntry;
}

function ActivityItem({ entry }: ActivityItemProps) {
    const { icon: Icon, accent } = activityConfig[entry.type];

    return (
        <div className="flex items-start gap-2 sm:gap-3 py-1.5 sm:py-2.5 border-b border-slate-100 dark:border-white/5 last:border-b-0 min-w-0">
            <span className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl shrink-0 mt-0.5 ${accent}`}>
                <Icon size={14} className="sm:w-4 sm:h-4" />
            </span>

            <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {entry.title}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight sm:leading-relaxed line-clamp-2 break-words">
                    {entry.description}
                </p>
            </div>

            <span className="text-[9px] sm:text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                {formatRelativeTime(entry.timestamp)}
            </span>
        </div>
    );
}

export default ActivityItem;
