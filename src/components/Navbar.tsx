import type { Dispatch, SetStateAction } from "react";
import { Search, Sun, Moon, ArrowLeft } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { getDisplayName, getInitial } from "../utils/user";
import NotificationPopover from "./NotificationPopover";

const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/projects": "Projects",
    "/tasks": "Tasks",
    "/repositories": "Repository Hub",
    "/settings": "Settings",
};

interface NavbarProps {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

function getPageTitle(pathname: string): string {
    if (pathname.startsWith("/projects/")) {
        if (pathname.includes("/repository")) return "Repository";
        return "Project Details";
    }
    return pageTitles[pathname] ?? "Workspace";
}

function Navbar({ isOpen, setIsOpen }: NavbarProps) {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    const title = getPageTitle(location.pathname);

    // Check if on sub-page detail route
    const isSubPage = location.pathname.startsWith("/projects/");

    function handleBack() {
        if (location.pathname.includes("/repository")) {
            const projectId = location.pathname.split("/")[2];
            navigate(`/projects/${projectId}`);
        } else {
            navigate("/projects");
        }
    }

    return (
        <header className="h-16 shrink-0 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
            {/* Left Section */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {/* Hamburger toggle for mobile */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-surface-dark-raised text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shrink-0"
                    aria-label="Toggle navigation menu"
                >
                    {isOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>

                {/* Back Button for Desktop Detail Sub-pages */}
                {isSubPage && (
                    <button
                        type="button"
                        onClick={handleBack}
                        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-surface-dark-raised text-slate-700 dark:text-slate-200 hover:text-ember hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-xs font-semibold shrink-0"
                        title="Go back"
                    >
                        <ArrowLeft size={14} />
                        <span>Back</span>
                    </button>
                )}

                <div className="min-w-0">
                    <h2 className="font-display text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-tight truncate">
                        {title}
                    </h2>
                    <p className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                        <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse shrink-0" />
                        <span>System Online • Gemini AI Connected</span>
                    </p>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Search Bar */}
                <div className="relative hidden md:block">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tasks & projects..."
                        className="w-48 lg:w-64 pl-9 pr-12 py-1.5 text-xs rounded-xl outline-none border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-ember/30 focus:border-ember transition-colors"
                    />
                    <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-200/60 dark:bg-white/10 border border-slate-300 dark:border-white/10">
                        ⌘K
                    </kbd>
                </div>

                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    aria-label="Toggle color theme"
                    className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised text-slate-600 dark:text-slate-300 hover:text-ember dark:hover:text-ember transition-colors"
                >
                    {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Notifications Popover */}
                <NotificationPopover />

                {/* Profile Pill */}
                <NavLink
                    to="/settings"
                    className="flex items-center gap-2 p-1 sm:pl-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                >
                    <div className="h-8 w-8 rounded-full bg-ember text-ink flex items-center justify-center font-bold font-mono text-xs shadow-xs border border-white/20 shrink-0">
                        {getInitial(user)}
                    </div>
                    <span className="hidden lg:inline text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {getDisplayName(user)}
                    </span>
                </NavLink>
            </div>
        </header>
    );
}

export default Navbar;
