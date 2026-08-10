import StatsGrid from "../components/dashboard/StatsGrid";
import RecentTasks from "../components/dashboard/RecentTasks";
import ProjectProgress from "../components/dashboard/ProjectProgress";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import AiProductivityCard from "../components/dashboard/AiProductivityCard";
import TaskVelocityChart from "../components/analytics/TaskVelocityChart";
import GithubActivityChart from "../components/analytics/GithubActivityChart";
import ProjectHealthGrid from "../components/analytics/ProjectHealthGrid";
import { useAuth } from "../hooks/useAuth";
import { useTasks } from "../hooks/useTasks";
import { useProjects } from "../hooks/useProjects";
import { getDisplayName } from "../utils/user";

function Dashboard() {
    const { user } = useAuth();
    const { tasks } = useTasks();
    const { projects } = useProjects();

    return (
        <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Welcome back, {getDisplayName(user)}
                </p>
                <span className="text-[11px] text-slate-400">
                    Workspace Overview
                </span>
            </div>

            <StatsGrid />

            <AiProductivityCard tasks={tasks} projects={projects} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <TaskVelocityChart tasks={tasks} />
                <GithubActivityChart />
            </div>

            <ProjectHealthGrid projects={projects} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <RecentTasks />
                <ProjectProgress />
            </div>

            <ActivityFeed />
        </div>
    );
}

export default Dashboard;
