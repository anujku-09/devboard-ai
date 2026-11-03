import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    GitBranch,
    ExternalLink,
    ArrowRight,
    GitCommit,
    GitPullRequest,
    Link2,
    ShieldCheck,
    RefreshCw,
    Unlink,
    Plus,
    Loader2,
    Lock,
    Globe,
} from "lucide-react";
import { useProjects } from "../hooks/useProjects";
import { useGithubConnection } from "../hooks/useGithubConnection";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import RepositoryPickerModal from "../components/projects/RepositoryPickerModal";
import { getAllRepositoryConnections, connectRepository, disconnectRepository } from "../services/repositoryService";
import { listUserRepositories } from "../services/githubApiService";
import { addWorkspaceNotification } from "../services/notificationService";
import type { GithubRepo, RepositoryConnection } from "../types/github";
import type { Project } from "../types/project";

function formatRepoTitle(raw: string): string {
    return raw
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .trim();
}

function RepositoryHub() {
    const { user } = useAuth();
    const { projects, loading: projectsLoading, refreshProjects, createProject } = useProjects();
    const { connection: githubConnection } = useGithubConnection();
    const { showToast } = useToast();

    const [connections, setConnections] = useState<RepositoryConnection[]>([]);
    const [connectionsLoading, setConnectionsLoading] = useState(true);

    // GitHub User Repositories for 1-Click Import
    const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([]);
    const [reposLoading, setReposLoading] = useState(false);
    const [importingRepoId, setImportingRepoId] = useState<number | null>(null);

    // Modal state for linking a repo to an existing project
    const [pickerTargetProject, setPickerTargetProject] = useState<Project | null>(null);

    const loadConnections = useCallback(async () => {
        setConnectionsLoading(true);
        try {
            const data = await getAllRepositoryConnections();
            setConnections(data);
        } catch (err) {
            console.error("Failed to load connections:", err);
        } finally {
            setConnectionsLoading(false);
        }
    }, []);

    const loadGithubRepos = useCallback(async () => {
        if (!githubConnection) {
            setGithubRepos([]);
            return;
        }

        setReposLoading(true);
        try {
            const data = await listUserRepositories();
            setGithubRepos(data);
        } catch (err) {
            console.warn("Could not fetch user GitHub repos:", err);
            setGithubRepos([]);
        } finally {
            setReposLoading(false);
        }
    }, [githubConnection]);

    useEffect(() => {
        void loadConnections();
        void loadGithubRepos();
    }, [loadConnections, loadGithubRepos]);

    async function handleSelectRepo(repo: GithubRepo) {
        if (!pickerTargetProject) return;
        await connectRepository(pickerTargetProject.id, repo);
        setPickerTargetProject(null);
        await loadConnections();
        await refreshProjects();
    }

    async function handleUnlinkRepo(project: Project) {
        await disconnectRepository(project.id);
        await loadConnections();
        await refreshProjects();
    }

    async function handleSync() {
        await refreshProjects();
        await loadConnections();
        await loadGithubRepos();
    }

    // 1-Click Zero-Fatigue Import from GitHub
    async function handleImportRepo(repo: GithubRepo) {
        setImportingRepoId(repo.id);
        try {
            const formattedName = formatRepoTitle(repo.name);
            const newProject = await createProject({
                name: formattedName,
                description: repo.description || `Developer project repository for ${repo.name}.`,
                status: "Active",
                progress: 10,
            });

            if (newProject?.id) {
                await connectRepository(newProject.id, repo);
            }

            if (user?.id) {
                addWorkspaceNotification(user.id, {
                    title: "GitHub Repository Imported",
                    message: `Created project "${formattedName}" and linked with ${repo.fullName}.`,
                    type: "success",
                });
            }

            showToast(`Imported "${formattedName}" as an active project!`, "success");
            await loadConnections();
            await refreshProjects();
        } catch (err) {
            console.error("Failed to 1-click import repo:", err);
            showToast(err instanceof Error ? err.message : "Failed to import project.", "error");
        } finally {
            setImportingRepoId(null);
        }
    }

    const connectedProjectIds = new Set(connections.map((c) => c.projectId));
    const connectedRepoFullNames = new Set(connections.map((c) => c.fullName.toLowerCase()));

    // Available unimported GitHub repositories
    const unimportedRepos = useMemo(() => {
        return githubRepos.filter((r) => !connectedRepoFullNames.has(r.fullName.toLowerCase()));
    }, [githubRepos, connectedRepoFullNames]);

    const isLoading = projectsLoading || connectionsLoading;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 max-w-full overflow-hidden"
        >
            {/* Action Header */}
            <div className="flex items-center justify-between gap-4">
                <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Central Repository Index ({connectedProjectIds.size}/{projects.length} connected)
                </span>

                <button
                    type="button"
                    onClick={() => void handleSync()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shrink-0"
                >
                    <RefreshCw size={13} />
                    <span>Sync Repositories</span>
                </button>
            </div>

            {/* Top Workspace Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 p-3.5 sm:p-5 shadow-xs flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-signal/10 text-signal shrink-0">
                        <GitBranch size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Connected Repos
                        </p>
                        <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                            {connectedProjectIds.size} <span className="text-xs font-normal text-slate-400">/ {projects.length} projects</span>
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 p-3.5 sm:p-5 shadow-xs flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-ember/10 text-ember shrink-0">
                        <ShieldCheck size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Integration Auth
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                            {githubConnection ? `@${githubConnection.githubUsername}` : "Not Connected"}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 p-3.5 sm:p-5 shadow-xs flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                        <GitCommit size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Code Intelligence
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                            Gemini 3.5 Active
                        </p>
                    </div>
                </div>
            </div>

            {/* Zero-Fatigue 1-Click Import Section */}
            {githubConnection && unimportedRepos.length > 0 && (
                <div className="rounded-2xl border border-ember/30 bg-ember/5 p-4 sm:p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Plus size={16} className="text-ember" />
                                <span>Quick Import from GitHub ({reposLoading ? "scanning..." : `${unimportedRepos.length} available`})</span>
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Avoid manual typing. Click import to create a project and link the repository automatically.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                        {unimportedRepos.slice(0, 6).map((repo) => (
                            <div
                                key={repo.id}
                                className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark flex flex-col justify-between gap-3 shadow-xs"
                            >
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                                            {repo.name}
                                        </p>
                                        {repo.private ? (
                                            <span className="p-1 rounded bg-slate-100 dark:bg-white/5 text-slate-400" title="Private Repository">
                                                <Lock size={11} />
                                            </span>
                                        ) : (
                                            <span className="p-1 rounded bg-slate-100 dark:bg-white/5 text-slate-400" title="Public Repository">
                                                <Globe size={11} />
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                        {repo.description || "No description on GitHub."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void handleImportRepo(repo)}
                                    disabled={importingRepoId === repo.id}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-ember text-ink text-xs font-semibold hover:bg-ember-dark transition-colors disabled:opacity-50"
                                >
                                    {importingRepoId === repo.id ? (
                                        <>
                                            <Loader2 size={12} className="animate-spin" />
                                            <span>Importing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={12} />
                                            <span>1-Click Import</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Repositories Catalog Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                        Connected Workspace Projects
                    </h2>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                        Select a repository to view live commits & pull requests
                    </span>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-40 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 p-8 text-center space-y-3 bg-white dark:bg-surface-dark">
                        <GitBranch size={32} className="mx-auto text-slate-400" />
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            No projects created yet
                        </p>
                        <Link
                            to="/projects"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ember text-ink text-xs font-semibold hover:bg-ember-dark transition-colors"
                        >
                            Create First Project
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projects.map((project) => {
                            const conn = connections.find((c) => c.projectId === project.id);

                            return (
                                <div
                                    key={project.id}
                                    className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 p-4 sm:p-5 shadow-xs space-y-3.5 hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col justify-between"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                                                    {project.name}
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                                    {project.description || "No project description provided."}
                                                </p>
                                            </div>

                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 shrink-0">
                                                {project.status}
                                            </span>
                                        </div>

                                        {/* GitHub Repo Badge */}
                                        {conn ? (
                                            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised text-xs font-mono font-medium text-slate-800 dark:text-slate-200 min-w-0">
                                                <a
                                                    href={conn.htmlUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 min-w-0 hover:text-ember transition-colors truncate"
                                                >
                                                    <GitBranch size={14} className="text-signal shrink-0" />
                                                    <span className="truncate">{conn.fullName}</span>
                                                    <ExternalLink size={12} className="shrink-0 text-slate-400" />
                                                </a>

                                                <button
                                                    type="button"
                                                    onClick={() => void handleUnlinkRepo(project)}
                                                    className="p-1 rounded text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
                                                    title="Unlink Repository"
                                                >
                                                    <Unlink size={13} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-surface-dark-raised/30 text-xs text-slate-400">
                                                <span className="flex items-center gap-1.5 truncate">
                                                    <Link2 size={14} className="shrink-0" />
                                                    <span>No GitHub repository connected</span>
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setPickerTargetProject(project)}
                                                    className="text-xs font-semibold text-ember hover:underline shrink-0"
                                                >
                                                    Connect Repo
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <GitCommit size={13} />
                                                <span>{conn?.defaultBranch || "main"}</span>
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <GitPullRequest size={13} />
                                                <span>PRs</span>
                                            </span>
                                        </div>

                                        {conn ? (
                                            <Link
                                                to={`/projects/${project.id}/repository`}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-ember/10 text-ember hover:bg-ember/20 text-xs font-semibold transition-colors shrink-0"
                                            >
                                                <span>Open Dashboard</span>
                                                <ArrowRight size={13} />
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setPickerTargetProject(project)}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-ember text-ink text-xs font-semibold hover:bg-ember-dark transition-colors shrink-0 shadow-xs"
                                            >
                                                <span>Connect Repo</span>
                                                <Link2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Repository Picker Modal */}
            <RepositoryPickerModal
                open={Boolean(pickerTargetProject)}
                onClose={() => setPickerTargetProject(null)}
                onSelect={handleSelectRepo}
            />
        </motion.div>
    );
}

export default RepositoryHub;
