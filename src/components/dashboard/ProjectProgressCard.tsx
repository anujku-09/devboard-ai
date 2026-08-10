import ProgressBar from "./ProgressBar";

interface ProjectProgressCardProps {
    title: string;
    progress: number;
    taskRatio?: string;
}

function ProjectProgressCard({
    title,
    progress,
    taskRatio,
}: ProjectProgressCardProps) {
    return (
        <div className="space-y-1 sm:space-y-1.5 min-w-0">
            <div className="flex justify-between items-center gap-2 min-w-0">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm truncate min-w-0 flex-1">
                    {title}
                </p>
                <span className="text-[10px] sm:text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0 font-semibold flex items-center gap-1">
                    <span>{progress}%</span>
                    {taskRatio && <span className="text-[10px] text-slate-400 font-normal">{taskRatio}</span>}
                </span>
            </div>
            <ProgressBar value={progress} />
        </div>
    );
}

export default ProjectProgressCard;