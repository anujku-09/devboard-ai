import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Search, Lock, GitBranch } from "lucide-react";
import { Link } from "react-router-dom";

import { listUserRepositories } from "../../services/githubApiService";
import type { GithubRepo } from "../../types/github";

interface RepositoryPickerModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (repo: GithubRepo) => Promise<void>;
}

function RepositoryPickerModal({ open, onClose, onSelect }: RepositoryPickerModalProps) {
    const [repos, setRepos] = useState<GithubRepo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [connectingId, setConnectingId] = useState<number | null>(null);

    useEffect(() => {
        if (!open) return;

        let cancelled = false;

        async function loadRepos() {
            setQuery("");
            setConnectingId(null);
            setLoading(true);
            setError(null);

            try {
                const data = await listUserRepositories();
                if (!cancelled) setRepos(data);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to load repositories.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadRepos();

        return () => {
            cancelled = true;
        };
    }, [open]);

    const filteredRepos = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return repos;
        return repos.filter((repo) => repo.fullName.toLowerCase().includes(term));
    }, [repos, query]);

    async function handleSelect(repo: GithubRepo) {
        setConnectingId(repo.id);
        setError(null);

        try {
            await onSelect(repo);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to connect repository.");
        } finally {
            setConnectingId(null);
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={(event) => event.stopPropagation()}
                        className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
                                Connect a repository
                            </h2>

                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="relative mb-4">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search repositories..."
                                className="w-full rounded-xl pl-9 pr-4 py-2.5 border border-slate-300 dark:border-white/10 bg-white dark:bg-surface-dark-raised text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-colors"
                            />
                        </div>

                        <div className="overflow-y-auto -mx-2 px-2 space-y-2">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="h-16 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse"
                                    />
                                ))
                            ) : error ? (
                                <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 text-center">
                                    <p className="text-sm text-danger">{error}</p>
                                    <Link
                                        to="/settings"
                                        className="mt-2 inline-block text-sm font-medium text-ember hover:underline"
                                    >
                                        Go to Settings
                                    </Link>
                                </div>
                            ) : filteredRepos.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                    {repos.length === 0
                                        ? "No repositories found on your GitHub account."
                                        : "No repositories match your search."}
                                </div>
                            ) : (
                                filteredRepos.map((repo) => (
                                    <button
                                        key={repo.id}
                                        type="button"
                                        onClick={() => void handleSelect(repo)}
                                        disabled={connectingId !== null}
                                        className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-white/10 p-3 text-left hover:border-ember/50 hover:bg-ember/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 shrink-0">
                                                <GitBranch size={16} />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-medium text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                                                    {repo.fullName}
                                                    {repo.private && (
                                                        <Lock size={12} className="text-slate-400 shrink-0" />
                                                    )}
                                                </p>
                                                {repo.description && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                        {repo.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {connectingId === repo.id && (
                                            <span className="h-4 w-4 rounded-full border-2 border-ember border-t-transparent animate-spin shrink-0" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default RepositoryPickerModal;