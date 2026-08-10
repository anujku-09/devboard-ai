import { getGithubAccessToken } from "./githubService";
import type {
    GithubCommit,
    GithubIssue,
    GithubPullRequest,
    GithubRepo,
    IssueState,
    PullRequestState,
} from "../types/github";

const GITHUB_API_BASE = "https://api.github.com";

interface GithubApiRepo {
    id: number;
    name: string;
    full_name: string;
    owner: { login: string };
    private: boolean;
    html_url: string;
    description: string | null;
    default_branch: string;
    updated_at: string;
}

function mapRepo(repo: GithubApiRepo): GithubRepo {
    return {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        private: repo.private,
        htmlUrl: repo.html_url,
        description: repo.description,
        defaultBranch: repo.default_branch,
        updatedAt: repo.updated_at,
    };
}

async function githubRequest<T>(path: string): Promise<T> {
    const token = await getGithubAccessToken();

    if (!token) {
        throw new Error("Connect your GitHub account in Settings before browsing repositories.");
    }

    const response = await fetch(`${GITHUB_API_BASE}${path}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
        },
    });

    if (response.status === 401) {
        throw new Error("Your GitHub connection has expired. Reconnect it in Settings.");
    }

    if (!response.ok) {
        throw new Error(`GitHub API request failed (${response.status}).`);
    }

    return response.json() as Promise<T>;
}

interface GithubApiCommitAuthor {
    login: string;
    avatar_url: string;
}

interface GithubApiCommit {
    sha: string;
    html_url: string;
    commit: {
        message: string;
        author: { name: string; date: string } | null;
    };
    author: GithubApiCommitAuthor | null;
}

function mapCommit(commit: GithubApiCommit): GithubCommit {
    return {
        sha: commit.sha,
        message: commit.commit.message.split("\n")[0],
        authorName: commit.commit.author?.name ?? commit.author?.login ?? "Unknown",
        authorLogin: commit.author?.login ?? null,
        authorAvatarUrl: commit.author?.avatar_url ?? null,
        date: commit.commit.author?.date ?? "",
        htmlUrl: commit.html_url,
    };
}

export async function listUserRepositories(): Promise<GithubRepo[]> {
    const repos = await githubRequest<GithubApiRepo[]>(
        "/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member"
    );

    return repos.map(mapRepo);
}

export async function listCommits(
    owner: string,
    repo: string,
    branch: string
): Promise<GithubCommit[]> {
    const commits = await githubRequest<GithubApiCommit[]>(
        `/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=30`
    );

    return commits.map(mapCommit);
}

interface GithubApiPullRequest {
    id: number;
    number: number;
    title: string;
    state: "open" | "closed";
    draft: boolean;
    merged_at: string | null;
    html_url: string;
    user: { login: string; avatar_url: string } | null;
    created_at: string;
    updated_at: string;
}

function mapPullRequest(pr: GithubApiPullRequest): GithubPullRequest {
    let state: PullRequestState;

    if (pr.draft) {
        state = "draft";
    } else if (pr.merged_at) {
        state = "merged";
    } else {
        state = pr.state;
    }

    return {
        id: pr.id,
        number: pr.number,
        title: pr.title,
        state,
        authorLogin: pr.user?.login ?? "unknown",
        authorAvatarUrl: pr.user?.avatar_url ?? null,
        htmlUrl: pr.html_url,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
    };
}

export async function listPullRequests(
    owner: string,
    repo: string
): Promise<GithubPullRequest[]> {
    const pulls = await githubRequest<GithubApiPullRequest[]>(
        `/repos/${owner}/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=20`
    );

    return pulls.map(mapPullRequest);
}

interface GithubApiIssueLabel {
    name: string;
    color: string;
}

interface GithubApiIssue {
    id: number;
    number: number;
    title: string;
    state: IssueState;
    html_url: string;
    user: { login: string; avatar_url: string } | null;
    created_at: string;
    updated_at: string;
    comments: number;
    labels: Array<GithubApiIssueLabel | string>;
    pull_request?: Record<string, unknown>;
}

function mapIssue(issue: GithubApiIssue): GithubIssue {
    return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        state: issue.state,
        authorLogin: issue.user?.login ?? "unknown",
        authorAvatarUrl: issue.user?.avatar_url ?? null,
        htmlUrl: issue.html_url,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        commentsCount: issue.comments,
        labels: issue.labels.map((label) =>
            typeof label === "string"
                ? { name: label, color: "gray" }
                : { name: label.name, color: label.color }
        ),
    };
}

export async function listIssues(
    owner: string,
    repo: string
): Promise<GithubIssue[]> {
    const issues = await githubRequest<GithubApiIssue[]>(
        `/repos/${owner}/${repo}/issues?state=all&sort=updated&direction=desc&per_page=20`
    );

    // GitHub returns pull requests in the /issues endpoint; filter them out
    return issues.filter((issue) => !issue.pull_request).map(mapIssue);
}