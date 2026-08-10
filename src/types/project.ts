export interface Project {
    id: string;
    user_id: string; 
    name: string;
    description: string;
    status: "Active" | "Completed" | "On Hold";
    progress: number;
    created_at: string;
    githubRepo?: string;
}

export type CollaboratorRole = "Admin" | "Contributor" | "Viewer";

export interface ProjectCollaborator {
    id: string;
    projectId: string;
    email: string;
    role: CollaboratorRole;
    createdAt: string;
}