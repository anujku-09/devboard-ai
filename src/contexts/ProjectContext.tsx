import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Project } from "../types/project";
import {
  getProjects,
  createProject as createProjectService,
  updateProject as updateProjectService,
  deleteProject as deleteProjectService,
  type ProjectInput,
} from "../services/projectService";

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  error: string | null;
  createProject: (project: ProjectInput) => Promise<void>;
  updateProject: (id: string, updates: ProjectInput) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
      const rawMessage = err instanceof Error ? err.message : "Failed to load projects.";
      if (
        rawMessage.toLowerCase().includes("does not exist") ||
        rawMessage.toLowerCase().includes("could not find the table")
      ) {
        setError("The \"projects\" table doesn't exist in your Supabase project yet. Run supabase/schema.sql in the Supabase SQL editor, then retry.");
      } else {
        setError(rawMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  const createProject = useCallback(async (project: ProjectInput) => {
    const newProject = await createProjectService(project);
    setProjects((prev) => [newProject, ...prev]);
    await refreshProjects();
  }, [refreshProjects]);

  const updateProject = useCallback(async (id: string, updates: ProjectInput) => {
    const updated = await updateProjectService(id, updates);
    setProjects((prev) => prev.map((project) => (project.id === id ? updated : project)));
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await deleteProjectService(id);
    setProjects((prev) => prev.filter((project) => project.id !== id));
  }, []);

  const value = useMemo<ProjectContextType>(() => ({
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects,
  }), [projects, loading, error, createProject, updateProject, deleteProject, refreshProjects]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectsContext() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectsContext must be used inside ProjectProvider");
  }
  return context;
}

export default ProjectProvider;