import { useProjectsContext } from "../contexts/ProjectContext";

export function useProjects() {
    return useProjectsContext();
}
