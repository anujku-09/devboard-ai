import { useMemo, useState } from "react";
import { Search, RefreshCw, Plus } from "lucide-react";

import ProjectList from "../components/projects/ProjectList";
import ProjectModal from "../components/projects/ProjectModal";
import { useProjects } from "../hooks/useProjects";
import { useToast } from "../hooks/useToast";
import type { ProjectFormData } from "../schemas/projectSchema";
import type { Project } from "../types/project";

type StatusFilter = "All" | Project["status"];
type SortOption = "newest" | "oldest" | "progress" | "name";

function Projects() {
    const {
        projects,
        loading,
        error,
        createProject,
        updateProject,
        deleteProject,
        refreshProjects,
    } = useProjects();

    const { showToast } = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
    const [sortOption, setSortOption] = useState<SortOption>("newest");

    const visibleProjects = useMemo(() => {
        let result = projects;

        if (statusFilter !== "All") {
            result = result.filter((project) => project.status === statusFilter);
        }

        const query = searchTerm.trim().toLowerCase();

        if (query.length > 0) {
            result = result.filter(
                (project) =>
                    project.name.toLowerCase().includes(query) ||
                    project.description.toLowerCase().includes(query)
            );
        }

        const sorted = [...result];

        switch (sortOption) {
            case "oldest":
                sorted.sort(
                    (a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                break;
            case "progress":
                sorted.sort((a, b) => b.progress - a.progress);
                break;
            case "name":
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "newest":
            default:
                sorted.sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                break;
        }

        return sorted;
    }, [projects, searchTerm, statusFilter, sortOption]);

    function openCreateModal() {
        setEditingProject(null);
        setIsModalOpen(true);
    }

    function openEditModal(project: Project) {
        setEditingProject(project);
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditingProject(null);
    }

    async function handleSubmit(data: ProjectFormData) {
        try {
            if (editingProject) {
                await updateProject(editingProject.id, data);
                showToast("Project updated successfully", "success");
            } else {
                await createProject(data);
                showToast("Project created successfully", "success");
            }

            closeModal();
        } catch (err) {
            console.error(err);
            const message =
                err instanceof Error
                    ? err.message
                    : typeof err === "object" && err !== null && "message" in err && typeof (err as { message?: unknown }).message === "string"
                      ? (err as { message: string }).message
                      : undefined;
            showToast(
                message ??
                    (editingProject
                        ? "Failed to update project"
                        : "Failed to create project"),
                "error"
            );
        }
    }

    async function handleDelete(project: Project) {
        try {
            await deleteProject(project.id);
            showToast("Project deleted", "success");
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Failed to delete project";
            showToast(message, "error");
            throw err;
        }
    }

    if (loading) {
        return (
            <div className="space-y-4 sm:space-y-6">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <div className="h-8 w-40 rounded bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                        <div className="h-4 w-56 rounded bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                    </div>
                    <div className="h-10 w-32 rounded-lg bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                </div>

                {Array.from({ length: 3 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-32 sm:h-40 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-6 sm:p-12 text-center space-y-4">
                <p className="text-danger font-medium max-w-lg mx-auto text-xs sm:text-sm">{error}</p>

                <button
                    onClick={refreshProjects}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-xs sm:text-sm"
                >
                    <RefreshCw size={16} />
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3.5 sm:space-y-6 max-w-full overflow-hidden">
            {/* Desktop Action Header */}
            <div className="hidden sm:flex items-center justify-between gap-3">
                <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    All Workspace Projects ({projects.length})
                </span>

                <button
                    type="button"
                    onClick={openCreateModal}
                    className="bg-ember text-ink font-medium px-5 py-2 text-sm rounded-xl hover:bg-ember-dark transition-colors inline-flex items-center gap-1.5 shrink-0"
                >
                    <Plus size={16} />
                    <span>Add Project</span>
                </button>
            </div>

            {/* Mobile Header / Quick Add Bar */}
            <div className="flex sm:hidden items-center justify-between gap-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {projects.length} project{projects.length === 1 ? "" : "s"} total
                </p>
                <button
                    type="button"
                    onClick={openCreateModal}
                    className="bg-ember text-ink font-semibold px-3 py-1.5 text-xs rounded-xl hover:bg-ember-dark transition-colors inline-flex items-center gap-1 shrink-0"
                >
                    <Plus size={14} />
                    <span>Add Project</span>
                </button>
            </div>

            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <div className="relative flex-1">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search projects..."
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark-raised text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-colors"
                    />
                </div>

                <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                        className="w-full sm:w-auto px-2.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark-raised text-slate-900 dark:text-slate-100 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-colors"
                    >
                        <option value="All">All statuses</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                    </select>

                    <select
                        value={sortOption}
                        onChange={(event) => setSortOption(event.target.value as SortOption)}
                        className="w-full sm:w-auto px-2.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark-raised text-slate-900 dark:text-slate-100 outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 transition-colors"
                    >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="progress">Progress</option>
                        <option value="name">Name (A–Z)</option>
                    </select>
                </div>
            </div>

            {projects.length > 0 && visibleProjects.length === 0 ? (
                <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-6 text-center">
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        No projects match your search or filter.
                    </p>
                </div>
            ) : (
                <ProjectList
                    projects={visibleProjects}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                />
            )}

            <ProjectModal
                open={isModalOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                initialValues={
                    editingProject
                        ? {
                              name: editingProject.name,
                              description: editingProject.description,
                              status: editingProject.status,
                              progress: editingProject.progress,
                          }
                        : undefined
                }
            />
        </div>
    );
}

export default Projects;
