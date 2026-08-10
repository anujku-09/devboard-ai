export interface GithubConnection {
    id: string;
    userId: string;
    githubUserId: string;
    githubUsername: string;
    avatarUrl: string | null;
    scope: string | null;
    connectedAt: string;
}

export interface GithubRepo {
    id: number;
    name: string;
    fullName: string;
    owner: string;
    private: boolean;
    htmlUrl: string;
    description: string | null;
    defaultBranch: string;
    updatedAt: string;
}

export interface RepositoryConnection {
    id: string;
    projectId: string;
    userId: string;
    githubRepoId: number;
    fullName: string;
    name: string;
    owner: string;
    private: boolean;
    htmlUrl: string;
    defaultBranch: string;
    connectedAt: string;
}

export interface GithubCommit {
    sha: string;
    message: string;
    authorName: string;
    authorLogin: string | null;
    authorAvatarUrl: string | null;
    htmlUrl: string;
    date: string;
}

export type PullRequestState = "open" | "closed" | "merged" | "draft";

export interface GithubPullRequest {
    id: number;
    number: number;
    title: string;
    state: PullRequestState;
    authorLogin: string;
    authorAvatarUrl: string | null;
    htmlUrl: string;
    createdAt: string;
    updatedAt: string;
}

export type IssueState = "open" | "closed";

export interface GithubIssueLabel {
    name: string;
    color: string;
}

export interface GithubIssue {
    id: number;
    number: number;
    title: string;
    state: IssueState;
    authorLogin: string;
    authorAvatarUrl: string | null;
    htmlUrl: string;
    createdAt: string;
    updatedAt: string;
    commentsCount: number;
    labels: GithubIssueLabel[];
}

export type TaskGithubLinkType = "issue" | "pull_request";

export interface TaskGithubLink {
    id: string;
    taskId: string;
    userId: string;
    linkType: TaskGithubLinkType;
    number: number;
    title: string;
    state: string;
    htmlUrl: string;
    linkedAt: string;
}