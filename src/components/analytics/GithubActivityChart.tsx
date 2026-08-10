import { motion } from "framer-motion";
import { GitBranch, GitCommit, GitPullRequest, ExternalLink, CheckCircle } from "lucide-react";
import { useGithubConnection } from "../../hooks/useGithubConnection";
import { Link } from "react-router-dom";

function GithubActivityChart() {
    const { connection, loading } = useGithubConnection();

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6 max-w-full overflow-hidden"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-2xl bg-ember/10 p-2 text-ember shrink-0">
                        <GitBranch size={20} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Version Control</p>
                        <h2 className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
                            GitHub Integration Metrics
                        </h2>
                    </div>
                </div>

                {connection ? (
                    <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-signal/20 bg-signal/10 text-signal text-[11px] sm:text-xs font-semibold">
                        <CheckCircle size={12} />
                        Connected
                    </span>
                ) : (
                    <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-300 dark:border-white/10 text-slate-500 text-[11px] sm:text-xs font-semibold">
                        Disconnected
                    </span>
                )}
            </div>

            {loading ? (
                <div className="h-32 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
            ) : connection ? (
                <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised p-3 sm:p-4">
                        <div className="flex items-center gap-3 min-w-0">
                            {connection.avatarUrl ? (
                                <img
                                    src={connection.avatarUrl}
                                    alt={connection.githubUsername}
                                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shrink-0"
                                />
                            ) : (
                                <span className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-ember/10 text-ember flex items-center justify-center font-bold shrink-0 text-xs sm:text-sm">
                                    {connection.githubUsername.charAt(0).toUpperCase()}
                                </span>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                                    @{connection.githubUsername}
                                </p>
                                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                                    Scope: {connection.scope ?? "read:user repo"}
                                </p>
                            </div>
                        </div>

                        <Link
                            to="/settings"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-ember hover:underline shrink-0 self-start sm:self-auto"
                        >
                            <ExternalLink size={13} />
                            Settings
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised p-2.5 sm:p-3.5 flex items-center gap-2 sm:gap-3 min-w-0">
                            <span className="p-1.5 rounded-lg sm:rounded-xl bg-ember/10 text-ember shrink-0">
                                <GitCommit size={16} />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] uppercase font-semibold text-slate-400 truncate">Commits</p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Active</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised p-2.5 sm:p-3.5 flex items-center gap-2 sm:gap-3 min-w-0">
                            <span className="p-1.5 rounded-lg sm:rounded-xl bg-signal/10 text-signal shrink-0">
                                <GitPullRequest size={16} />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] uppercase font-semibold text-slate-400 truncate">PR & Link</p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Enabled</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-4 sm:p-6 text-center text-xs sm:text-sm space-y-3">
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                        Connect your GitHub account to sync repositories, commits, and pull requests directly to your workspace.
                    </p>
                    <Link
                        to="/settings"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ember text-ink text-xs sm:text-sm font-medium hover:bg-ember-dark transition-colors"
                    >
                        Connect GitHub
                    </Link>
                </div>
            )}
        </motion.div>
    );
}

export default GithubActivityChart;
