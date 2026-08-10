import {
    FolderKanban,
    PlayCircle,
    CheckCircle2,
    PauseCircle,
} from "lucide-react";

import StatCard from "./StatCard";
import { useProjects } from "../../hooks/useProjects";

function StatsGrid() {
    const { projects, loading } = useProjects();

    const total = projects.length;
    const active = projects.filter((p) => p.status === "Active").length;
    const completed = projects.filter((p) => p.status === "Completed").length;
    const onHold = projects.filter((p) => p.status === "On Hold").length;

    const stats = [
        {
            title: "Total Projects",
            value: total,
            subtitle: total === 0 ? "Create one" : `${active} active`,
            icon: FolderKanban,
            accent: "ember" as const,
        },
        {
            title: "Active",
            value: active,
            subtitle: "In progress",
            icon: PlayCircle,
            accent: "signal" as const,
        },
        {
            title: "Completed",
            value: completed,
            subtitle: total > 0 ? `${Math.round((completed / total) * 100)}% done` : "0 done",
            icon: CheckCircle2,
            accent: "signal" as const,
        },
        {
            title: "On Hold",
            value: onHold,
            subtitle: "Attention",
            icon: PauseCircle,
            accent: "danger" as const,
        },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-20 sm:h-28 rounded-xl sm:rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-6">
            {stats.map((stat) => (
                <StatCard key={stat.title} {...stat} />
            ))}
        </div>
    );
}

export default StatsGrid;
