import ProgressBar from "./ProgressBar";

interface ProjectCardProps {
    title: string;
    progress: number;
}

function ProjectCard({
    title,
    progress,
}: ProjectCardProps) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between">
                <p className="font-medium">
                    {title}
                </p>
                <span className="text-sm text-gray-500">
                    {progress}%
                </span>
            </div>
            <ProgressBar value={progress} />
        </div>
    );
}
export default ProjectCard;