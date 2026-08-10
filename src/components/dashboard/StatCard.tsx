import type { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: number;
    subtitle: string;
    icon: LucideIcon;
    accent?: "ember" | "signal" | "danger";
}

const accentStyles: Record<string, { icon: string; border: string }> = {
    ember: {
        icon: "bg-ember/15 text-ember",
        border: "border-l-3 sm:border-l-4 border-l-ember",
    },
    signal: {
        icon: "bg-signal/15 text-signal",
        border: "border-l-3 sm:border-l-4 border-l-signal",
    },
    danger: {
        icon: "bg-danger/15 text-danger",
        border: "border-l-3 sm:border-l-4 border-l-danger",
    },
};

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    accent = "ember",
}: StatCardProps) {
    return (
        <div
            className={`rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-3 sm:p-5 shadow-xs transition-all duration-200 ${accentStyles[accent].border}`}
        >
            <div className="flex items-center justify-between gap-1.5 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {title}
                </p>

                <span className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl ${accentStyles[accent].icon} shrink-0`}>
                    <Icon size={14} className="sm:w-4 sm:h-4" />
                </span>
            </div>

            <h2 className="font-mono text-lg sm:text-3xl font-extrabold mt-1 sm:mt-2 text-slate-900 dark:text-white">
                {value}
            </h2>

            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 truncate">
                {subtitle}
            </p>
        </div>
    );
}

export default StatCard;
