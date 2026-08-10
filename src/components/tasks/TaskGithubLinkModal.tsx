import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Search, CircleDot, GitPullRequest } from "lucide-react";
import { Link } from "react-router-dom";

import { listIssues, listPullRequests } from "../../services/githubApiService";
import { useRepositoryConnection } from "../../hooks/useRepositoryConnection";
import type { TaskGithubLinkType } from "../../types/github";

interface CombinedItem {
    linkType: TaskGithubLinkType;
    number: number;
    title: string;
    state: string;
    htmlUrl: string;
    updatedAt: string;
}

interface TaskGithubLinkModalProps {
    open: boolean;
    projectId: string;
    onClose: () => void;
    onSelect: (
        linkType: TaskGithubLinkType,
        item: { number: number; title: string; state: string; htmlUrl: string }
    ) => Promise<void>;
}

function TaskGithubLinkModal({ open, projectId, onClose, onSelect }: TaskGithubLinkModalProps) {
    const { connection, loading: connectionLoading } = useRepositoryConnection(projectId);

    const [items, setItems] = useState<CombinedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [linkingKey, setLinkingKey] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !connection) return;

        let cancelled = false;

        async function loadItems() {
            setQuery("");
            setLoading(true);
            setError(null);

            try {
                const [pullRequests, issues] = await Promise.all([
                    listPullRequests(connection!.owner, connection!.name),
                    listIssues(connection!.owner, connection!.name),
                ]);

                if (cancelled) return;

                const combined: CombinedItem[] = [
                    ...pullRequests.map((pr) => ({
                        linkType: "pull_request" as const,
                        number: pr.number,
                        title: pr.title,
                        state: pr.state,
                        htmlUrl: pr.htmlUrl,
                        updatedAt: pr.updatedAt,
                    })),
                    ...issues.map((issue) => ({
                        linkType: "issue" as const,
                        number: issue.number,
                        title: issue.title,
                        state: issue.state,
                        htmlUrl: issue.htmlUrl,
                        updatedAt: issue.updatedAt,
                    })),
                ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

                setItems(combined);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to load repository items.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadItems();

        return () => {
            cancelled = true;
        };
    }, [open, connection]);

    const filteredItems = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return items;
        return items.filter((item) => item.title.toLowerCase().includes(term));
    }, [items, query]);

    async function handleSelect(item: CombinedItem) {
        const key = `${item.linkType}-${item.number}`;
        setLinkingKey(key);
        setError(null);

        try {
            await onSelect(item.linkType, {
                number: item.number,
                title: item.title,
                state: item.state,
                htmlUrl: item.htmlUrl,
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to link task.");
        } finally {
            setLinkingKey(null);
        }
    }

    const isLoading = connectionLoading || loading;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={(event) => event.stopPropagation()}
                        className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[90vh] flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-3 min-w-0">
                            <h2 className="font-display text-lg sm:text-2xl font-semibold text-slate-900 dark:text-white truncate">
                                Link to GitHub
                            </h2>

                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {!connectionLoading && !connection ? (
                            <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-5 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                This task's project doesn't have a repository connected yet.
                                <Link
                                    to={`/projects/${projectId}`}
                                    className="mt-2 block font-medium text-ember hover:underline"
                                >
                                    Connect a repository
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="relative mb-3">
                                    <Search
                                        size={15}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder="Search issues and PRs..."
                                        className="w-full rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-white/10 bg-white dark:bg-surface-dark-raised text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-colors"
                                    />
                                </div>

                                <div className="overflow-y-auto -mx-1 px-1 space-y-2 flex-1">
                                    {isLoading ? (
                                        Array.from({ length: 4 }).map((_, index) => (
                                            <div
                                                key={index}
                                                className="h-12 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse"
                                            />
                                        ))
                                    ) : error ? (
                                        <p className="text-xs sm:text-sm text-danger text-center py-4">{error}</p>
                                    ) : filteredItems.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-5 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                            {items.length === 0
                                                ? "No open issues or pull requests found."
                                                : "Nothing matches your search."}
                                        </div>
                                    ) : (
                                        filteredItems.map((item) => {
                                            const key = `${item.linkType}-${item.number}`;
                                            const Icon = item.linkType === "issue" ? CircleDot : GitPullRequest;

                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => void handleSelect(item)}
                                                    disabled={linkingKey !== null}
                                                    className="w-full flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-white/10 p-2.5 sm:p-3 text-left hover:border-ember/50 hover:bg-ember/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
                                                >
                                                    <span className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 shrink-0">
                                                        <Icon size={15} />
                                                    </span>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                                            {item.title}
                                                        </p>
                                                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                                                            #{item.number} · {item.state}
                                                        </p>
                                                    </div>

                                                    {linkingKey === key && (
                                                        <span className="h-4 w-4 rounded-full border-2 border-ember border-t-transparent animate-spin shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default TaskGithubLinkModal;