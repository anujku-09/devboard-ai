import { useState, useMemo, useEffect } from "react";
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    Settings,
    LogOut,
    Sparkles,
    Folder,
    GitBranch,
    Activity,
    Bot,
    Wand2,
    X,
    ChevronDown,
} from "lucide-react";

import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { useProjects } from "../hooks/useProjects";
import { useTasks } from "../hooks/useTasks";
import { getAllRepositoryConnections } from "../services/repositoryService";
import type { RepositoryConnection } from "../types/github";
import { getDisplayName, getInitial } from "../utils/user";
import logoSvg from "../assets/logo.svg";
import ProjectHealthModal from "./projects/ProjectHealthModal";
import AiTaskSuggestionModal from "./projects/AiTaskSuggestionModal";
import ProjectBreakdownModal from "./projects/ProjectBreakdownModal";

interface SidebarProps {
    isOpen: boolean;
    onClose?: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { user, logout } = useAuth();
    const { projects } = useProjects();
    const { tasks, updateTask } = useTasks();
    const navigate = useNavigate();
    const location = useLocation();

    // AI Modal states launcher from sidebar
    const [healthModalOpen, setHealthModalOpen] = useState(false);
    const [suggestionModalOpen, setSuggestionModalOpen] = useState(false);
    const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);

    // Selected project state for AI actions
    const [manualProjectId, setManualProjectId] = useState<string | null>(null);
    const [repoConnections, setRepoConnections] = useState<RepositoryConnection[]>([]);

    useEffect(() => {
        void getAllRepositoryConnections().then(setRepoConnections);
    }, [projects, location.pathname]);

    // Detect active project from route /projects/:projectId
    const routeMatch = location.pathname.match(/\/projects\/([a-zA-Z0-9-]+)/);
    const routeProjectId = routeMatch ? routeMatch[1] : null;

    // Resolve target project: Route project > manual selection > first project
    const targetProject = useMemo(() => {
        if (routeProjectId) {
            const found = projects.find((p) => p.id === routeProjectId);
            if (found) return found;
        }
        if (manualProjectId) {
            const found = projects.find((p) => p.id === manualProjectId);
            if (found) return found;
        }
        return projects[0] || null;
    }, [projects, routeProjectId, manualProjectId]);

    async function handleLogout() {
        await logout();
        onClose?.();
        navigate("/");
    }

    function handleNavClick() {
        onClose?.();
    }

    const recentProjects = projects.slice(0, 4);
    const completedTasksCount = tasks.filter((t) => t.status === "Completed").length;
    const connectedProjectIds = new Set(repoConnections.map((c) => c.projectId));

    const mainMenuItems = [
        { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { title: "Projects", path: "/projects", icon: FolderKanban },
        { title: "Tasks", path: "/tasks", icon: CheckSquare },
        {
            title: "Repository Hub",
            path: "/repositories",
            icon: GitBranch,
            badge: connectedProjectIds.size > 0 ? `${connectedProjectIds.size}` : undefined,
        },
        { title: "Settings", path: "/settings", icon: Settings },
    ];

    function handleOpenAiModal(type: "health" | "suggestion" | "breakdown") {
        if (!targetProject) {
            navigate("/projects");
            onClose?.();
            return;
        }

        if (type === "health") setHealthModalOpen(true);
        if (type === "suggestion") setSuggestionModalOpen(true);
        if (type === "breakdown") setBreakdownModalOpen(true);
        onClose?.();
    }

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-ink/75 backdrop-blur-xs z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Fixed Drawer */}
            <aside
                className={`fixed top-0 left-0 h-screen w-[280px] max-w-[85vw] md:w-64 shrink-0 
                            bg-white dark:bg-surface-dark border-r border-slate-200 dark:border-white/10 
                            flex flex-col transform transition-transform duration-250 ease-out z-50 md:z-30 shadow-2xl md:shadow-none
                            ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
            >
                {/* Brand Header */}
                <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-white/10 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-white/10 p-1 flex items-center justify-center border border-slate-200/60 dark:border-white/10 shrink-0 shadow-2xs">
                            <img src={logoSvg} alt="DevBoard AI Logo" className="h-full w-full object-contain" />
                        </div>
                        <div>
                            <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center">
                                DevBoard<span className="brand-cursor h-4 align-middle" />
                            </h1>
                            <p className="text-[10px] font-mono text-slate-400 -mt-0.5 flex items-center gap-1">
                                <span>AI Edition</span>
                                <Sparkles size={9} className="text-ember" />
                            </p>
                        </div>
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
                        aria-label="Close menu"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 p-3.5 space-y-4 overflow-y-auto">
                    {/* Main Navigation */}
                    <div>
                        <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                            Main Menu
                        </p>
                        <div className="space-y-0.5">
                            {mainMenuItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.title}
                                        to={item.path}
                                        onClick={handleNavClick}
                                        className={({ isActive }) =>
                                            `relative flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${
                                                isActive
                                                    ? "bg-ember/10 text-ember font-semibold shadow-xs"
                                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    {isActive && (
                                                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-ember shadow-[0_0_8px_var(--color-ember)]" />
                                                    )}
                                                    <Icon size={17} className={isActive ? "text-ember" : "text-slate-400"} />
                                                    <span>{item.title}</span>
                                                </div>

                                                {item.badge && (
                                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-signal/15 text-signal border border-signal/20">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>

                    {/* AI Intelligence Hub */}
                    <div>
                        <div className="px-3 space-y-1.5 mb-2">
                            <div className="flex items-center justify-between gap-1">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                    AI Intelligence
                                </p>

                                {targetProject && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-ember/15 text-ember border border-ember/20 shrink-0 truncate max-w-[100px]">
                                        {targetProject.name}
                                    </span>
                                )}
                            </div>

                            {projects.length > 1 && (
                                <div className="relative flex items-center w-full">
                                    <select
                                        value={targetProject?.id || ""}
                                        onChange={(e) => setManualProjectId(e.target.value)}
                                        className="w-full appearance-none pl-2.5 pr-6 py-1 text-[11px] font-semibold rounded-xl bg-slate-100 dark:bg-surface-dark-raised text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 outline-none cursor-pointer truncate"
                                        title="Select AI Target Project"
                                    >
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id} className="bg-white dark:bg-surface-dark text-slate-900 dark:text-white font-medium">
                                                Target: {p.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2 text-slate-400 pointer-events-none" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-0.5">
                            <button
                                type="button"
                                onClick={() => handleOpenAiModal("health")}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all duration-150 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <Activity size={17} className="text-signal" />
                                    <span>Project Diagnostic</span>
                                </div>
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-signal/15 text-signal border border-signal/20">
                                    AI
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleOpenAiModal("breakdown")}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all duration-150 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <Wand2 size={17} className="text-ember" />
                                    <span>Feature Breakdown</span>
                                </div>
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-ember/15 text-ember border border-ember/20">
                                    AI
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleOpenAiModal("suggestion")}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all duration-150 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <Bot size={17} className="text-purple-400" />
                                    <span>Task Suggestion</span>
                                </div>
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/20">
                                    Next
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Active Projects Section */}
                    {recentProjects.length > 0 && (
                        <div>
                            <div className="px-3 flex items-center justify-between mb-1.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Active Projects
                                </p>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/10 px-1.5 py-0.2 rounded-full">
                                    {projects.length}
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                {recentProjects.map((proj) => (
                                    <div key={proj.id} className="flex items-center justify-between gap-1 group">
                                        <NavLink
                                            to={`/projects/${proj.id}`}
                                            onClick={handleNavClick}
                                            className={({ isActive }) =>
                                                `flex-1 relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 truncate ${
                                                    isActive
                                                        ? "bg-ember/10 text-ember font-semibold"
                                                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                                                }`
                                            }
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <Folder size={14} className={isActive ? "text-ember shrink-0" : "text-slate-400 shrink-0"} />
                                                    <span className="truncate">{proj.name}</span>
                                                </>
                                            )}
                                        </NavLink>

                                        {connectedProjectIds.has(proj.id) && (
                                            <NavLink
                                                to={`/projects/${proj.id}/repository`}
                                                onClick={handleNavClick}
                                                className="p-1 rounded-lg text-slate-400 hover:text-signal hover:bg-signal/10 transition-colors shrink-0"
                                                title={`${proj.name} Repository`}
                                            >
                                                <GitBranch size={13} />
                                            </NavLink>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Workspace Quick Metrics Summary */}
                    <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-surface-dark-raised/50 space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Workspace Metrics
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="p-2 rounded-xl bg-white dark:bg-surface-dark border border-slate-200/60 dark:border-white/5 shadow-2xs">
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{projects.length}</p>
                                <p className="text-[9px] text-slate-400 font-medium">Projects</p>
                            </div>
                            <div className="p-2 rounded-xl bg-white dark:bg-surface-dark border border-slate-200/60 dark:border-white/5 shadow-2xs">
                                <p className="text-xs font-bold text-signal">{completedTasksCount}/{tasks.length}</p>
                                <p className="text-[9px] text-slate-400 font-medium">Completed</p>
                            </div>
                        </div>
                    </div>

                    {/* AI Engine Status Banner Card */}
                    <div className="p-3 rounded-2xl border border-ember/20 bg-gradient-to-br from-ember/10 via-amber-500/5 to-transparent space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                                <Bot size={14} className="text-ember" />
                                <span>AI Engine</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-signal/15 text-signal border border-signal/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
                                Online
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            Gemini 2.5 Flash active for real-time task breakdowns & diagnostic insights.
                        </p>
                    </div>
                </nav>

                {/* User Section */}
                <div className="border-t border-slate-200 dark:border-white/10 p-3.5 space-y-2.5 bg-slate-50/50 dark:bg-surface-dark-raised/30 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-ember text-ink flex items-center justify-center font-bold font-mono text-xs border-2 border-white dark:border-surface-dark shadow-xs shrink-0">
                            {getInitial(user)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {getDisplayName(user)}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">Developer Workspace</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-medium text-danger hover:bg-danger/10 transition-colors border border-danger/20"
                    >
                        <LogOut size={13} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Sidebar AI Launcher Modals */}
            {targetProject && (
                <>
                    <ProjectHealthModal
                        open={healthModalOpen}
                        project={targetProject}
                        tasks={tasks.filter((t) => t.projectId === targetProject.id)}
                        repoConnected={connectedProjectIds.has(targetProject.id)}
                        onClose={() => setHealthModalOpen(false)}
                    />

                    <AiTaskSuggestionModal
                        open={suggestionModalOpen}
                        project={targetProject}
                        tasks={tasks.filter((t) => t.projectId === targetProject.id)}
                        onClose={() => setSuggestionModalOpen(false)}
                        onTaskUpdated={updateTask}
                    />

                    <ProjectBreakdownModal
                        open={breakdownModalOpen}
                        project={targetProject}
                        onClose={() => setBreakdownModalOpen(false)}
                        onTasksCreated={() => void 0}
                    />
                </>
            )}
        </>
    );
}

export default Sidebar;
