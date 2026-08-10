import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    ExternalLink,
    GitBranch,
    GitCommit,
    GitMerge,
    GitPullRequest,
    GitPullRequestClosed,
    GitPullRequestDraft,
    Lock,
    RefreshCw,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

import { getProjectById } from "../services/projectService";
import { useRepositoryConnection } from "../hooks/useRepositoryConnection";
import { useGithubCommits } from "../hooks/useGithubCommits";
import { useGithubPullRequests } from "../hooks/useGithubPullRequests";
import { formatRelativeTime } from "../utils/time";
import type { Project } from "../types/project";
import type { PullRequestState } from "../types/github";

const pullRequestStateConfig: Record<PullRequestState, { label: string; accent: string; icon: typeof GitPullRequest }> = {
    open: { label: "Open", accent: "bg-signal/10 text-signal", icon: GitPullRequest },
    draft: { label: "Draft", accent: "bg-slate-500/10 text-slate-500 dark:text-slate-400", icon: GitPullRequestDraft },
    merged: { label: "Merged", accent: "bg-ember/10 text-ember", icon: GitMerge },
    closed: { label: "Closed", accent: "bg-danger/10 text-danger", icon: GitPullRequestClosed },
};

function RepositoryDashboard() {
    const { projectId } = useParams();
    const [project, setProject] = useState<Project | null>(null);
    const [projectLoading, setProjectLoading] = useState(true);

    const [showAllCommits, setShowAllCommits] = useState(false);
    const [showAllPRs, setShowAllPRs] = useState(false);

    const { connection, loading: connectionLoading } = useRepositoryConnection(projectId);
    const { commits, loading: commitsLoading, error: commitsError, refresh: refreshCommits } = useGithubCommits(connection);
    const {
        pullRequests,
        loading: pullRequestsLoading,
        error: pullRequestsError,
        refresh: refreshPullRequests,
    } = useGithubPullRequests(connection);

    useEffect(() => {
        async function loadProject() {
            if (!projectId) {
                setProjectLoading(false);
                return;
            }

            try {
                setProjectLoading(true);
                const data = await getProjectById(projectId);
                setProject(data);
            } catch (err) {
                console.error(err);
            } finally {
                setProjectLoading(false);
            }
        }

        void loadProject();
    }, [projectId]);

    const loading = projectLoading || connectionLoading;

    const visibleCommits = showAllCommits ? commits : commits.slice(0, 5);
    const visiblePRs = showAllPRs ? pullRequests : pullRequests.slice(0, 5);

    return (
        <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
            <div className="flex items-center justify-between gap-2">
                <Link
                    to={`/projects/${projectId}`}
                    className="inline-flex md:hidden items-center text-xs font-semibold text-ember hover:underline shrink-0"
                >
                    <ArrowLeft size={14} className="mr-1" />
                    <span>Back to Project</span>
                </Link>

                <p className="hidden md:block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {project?.name ? `${project.name} Repository` : "Repository"}
                </p>
                <span className="text-[11px] text-slate-400">
                    Live Commit & PR Activity
                </span>
            </div>

            {loading ? (
                <div className="h-64 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
            ) : !connection ? (
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-6 sm:p-8 text-center space-y-3">
                    <div className="mx-auto w-fit p-3 rounded-full bg-ember/10 text-ember">
                        <GitBranch size={24} />
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-slate-200 text-xs sm:text-sm">
                        No repository connected
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Connect a GitHub repository from the project page to see its activity here.
                    </p>
                    <Link
                        to={`/projects/${projectId}`}
                        className="inline-flex items-center text-xs sm:text-sm font-medium text-ember hover:underline"
                    >
                        Go to project
                    </Link>
                </div>
            ) : (
                <>
                    {/* Repository Header Box */}
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-4 sm:p-6 shadow-xs min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="p-2 rounded-xl bg-signal/10 text-signal shrink-0">
                                    <GitBranch size={18} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs sm:text-sm truncate flex items-center gap-1.5">
                                        {connection.fullName}
                                        {connection.private && (
                                            <Lock size={12} className="text-slate-400 shrink-0" />
                                        )}
                                    </p>
                                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                                        Default branch: {connection.defaultBranch}
                                    </p>
                                </div>
                            </div>

                            <a
                                href={connection.htmlUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shrink-0 w-full sm:w-auto"
                            >
                                <ExternalLink size={15} />
                                <span>Open on GitHub</span>
                            </a>
                        </div>
                    </div>

                    {/* Commits Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-4 sm:p-6 shadow-xs min-w-0"
                    >
                        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                <div className="rounded-xl sm:rounded-2xl bg-ember/10 p-1.5 sm:p-2 text-ember shrink-0">
                                    <GitCommit size={18} className="sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                                        Branch: {connection.defaultBranch}
                                    </p>
                                    <h2 className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
                                        Recent commits ({commits.length})
                                    </h2>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => void refreshCommits()}
                                disabled={commitsLoading}
                                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 shrink-0"
                                aria-label="Refresh commits"
                            >
                                <RefreshCw size={15} className={commitsLoading ? "animate-spin" : ""} />
                            </button>
                        </div>

                        {commitsLoading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="h-10 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : commitsError ? (
                            <p className="text-xs sm:text-sm text-danger">{commitsError}</p>
                        ) : commits.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-4 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                No commits found on {connection.defaultBranch}.
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <ul className="space-y-1.5">
                                    <AnimatePresence mode="popLayout">
                                        {visibleCommits.map((commit) => (
                                            <motion.li
                                                key={commit.sha}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <a
                                                    href={commit.htmlUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised p-2 sm:p-3 hover:border-ember/50 hover:bg-ember/5 transition-colors min-w-0"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        {commit.authorAvatarUrl ? (
                                                            <img
                                                                src={commit.authorAvatarUrl}
                                                                alt={commit.authorName}
                                                                className="h-6 w-6 sm:h-8 sm:w-8 rounded-full shrink-0"
                                                            />
                                                        ) : (
                                                            <span className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                                                                {commit.authorName.charAt(0).toUpperCase()}
                                                            </span>
                                                        )}

                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                                                {commit.message}
                                                            </p>
                                                            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                                                                {commit.authorLogin ? `@${commit.authorLogin}` : commit.authorName}
                                                                {commit.date && ` · ${formatRelativeTime(commit.date)}`}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <span className="text-[10px] sm:text-xs font-mono text-slate-400 dark:text-slate-500 shrink-0 font-semibold bg-slate-200/60 dark:bg-white/10 px-1.5 py-0.5 rounded">
                                                        {commit.sha.slice(0, 7)}
                                                    </span>
                                                </a>
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>

                                {commits.length > 5 && (
                                    <div className="pt-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => setShowAllCommits(!showAllCommits)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                        >
                                            {showAllCommits ? (
                                                <>
                                                    <span>Show Less</span>
                                                    <ChevronUp size={13} />
                                                </>
                                            ) : (
                                                <>
                                                    <span>Show {commits.length - 5} More Commits</span>
                                                    <ChevronDown size={13} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* Pull Requests Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 }}
                        className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-4 sm:p-6 shadow-xs min-w-0"
                    >
                        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                <div className="rounded-xl sm:rounded-2xl bg-signal/10 p-1.5 sm:p-2 text-signal shrink-0">
                                    <GitPullRequest size={18} className="sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                                        Repository Pull Requests
                                    </p>
                                    <h2 className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
                                        Pull requests ({pullRequests.length})
                                    </h2>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => void refreshPullRequests()}
                                disabled={pullRequestsLoading}
                                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50 shrink-0"
                                aria-label="Refresh pull requests"
                            >
                                <RefreshCw size={15} className={pullRequestsLoading ? "animate-spin" : ""} />
                            </button>
                        </div>

                        {pullRequestsLoading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="h-10 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : pullRequestsError ? (
                            <p className="text-xs sm:text-sm text-danger">{pullRequestsError}</p>
                        ) : pullRequests.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-4 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                No pull requests found for this repository.
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <ul className="space-y-1.5">
                                    <AnimatePresence mode="popLayout">
                                        {visiblePRs.map((pr) => {
                                            const config = pullRequestStateConfig[pr.state];
                                            const StateIcon = config.icon;

                                            return (
                                                <motion.li
                                                    key={pr.id}
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.98 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <a
                                                        href={pr.htmlUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised p-2 sm:p-3 hover:border-ember/50 hover:bg-ember/5 transition-colors min-w-0"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                            <span className={`p-1 sm:p-2 rounded-lg sm:rounded-xl shrink-0 ${config.accent}`}>
                                                                <StateIcon size={14} className="sm:w-4 sm:h-4" />
                                                            </span>

                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                                                    {pr.title}
                                                                </p>
                                                                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                                                                    #{pr.number} by @{pr.authorLogin} · {formatRelativeTime(pr.updatedAt)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap shrink-0 ${config.accent}`}>
                                                            {config.label}
                                                        </span>
                                                    </a>
                                                </motion.li>
                                            );
                                        })}
                                    </AnimatePresence>
                                </ul>

                                {pullRequests.length > 5 && (
                                    <div className="pt-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => setShowAllPRs(!showAllPRs)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                        >
                                            {showAllPRs ? (
                                                <>
                                                    <span>Show Less</span>
                                                    <ChevronUp size={13} />
                                                </>
                                            ) : (
                                                <>
                                                    <span>Show {pullRequests.length - 5} More Pull Requests</span>
                                                    <ChevronDown size={13} />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </div>
    );
}

export default RepositoryDashboard;