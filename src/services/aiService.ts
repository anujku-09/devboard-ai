import type { AiProductivityInsight, AiProjectHealth, AiSuggestedTask, AiTaskSuggestion } from "../types/ai";
import type { Project } from "../types/project";
import type { Task } from "../types/task";

const GEMINI_MODEL = "models/gemini-flash-latest";
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 Minutes Cache TTL

interface CachedPayload<T> {
    timestamp: number;
    data: T;
}

/**
 * Smart Caching Helper for Gemini AI API Calls.
 * Caches responses in sessionStorage to protect API quotas.
 */
async function cacheAiResponse<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    forceRefresh: boolean = false,
    ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
    if (!forceRefresh) {
        try {
            const raw = sessionStorage.getItem(cacheKey);
            if (raw) {
                const parsed: CachedPayload<T> = JSON.parse(raw);
                const isExpired = Date.now() - parsed.timestamp > ttlMs;
                if (!isExpired) {
                    console.log(`[AI Cache Hit] Returning cached response for key: ${cacheKey}`);
                    return parsed.data;
                }
            }
        } catch (e) {
            console.warn("Failed to read from AI cache:", e);
        }
    }

    console.log(`[AI Cache Miss / Refresh] Fetching fresh response from Gemini API for key: ${cacheKey}`);
    const freshData = await fetcher();

    try {
        const payload: CachedPayload<T> = {
            timestamp: Date.now(),
            data: freshData,
        };
        sessionStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch (e) {
        console.warn("Failed to write to AI cache:", e);
    }

    return freshData;
}

function isQuotaExceededError(err: unknown): boolean {
    if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        return (
            msg.includes("quota exceeded") ||
            msg.includes("rate-limits") ||
            msg.includes("429") ||
            msg.includes("free_tier_requests") ||
            msg.includes("resource_exhausted")
        );
    }
    return false;
}

export async function generateProjectBreakdown(
    projectName: string,
    projectDescription: string,
    forceRefresh: boolean = false
): Promise<AiSuggestedTask[]> {
    const cacheKey = `ai_breakdown_${projectName.replace(/\s+/g, "_")}`;

    return cacheAiResponse(
        cacheKey,
        async () => {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                throw new Error(
                    "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file."
                );
            }

            const prompt = `You are a senior engineering lead breaking a software project into an actionable task list.

Project Name: ${projectName}
Project Description: ${projectDescription || "No description provided."}

Break this project into 5 to 10 concrete, actionable engineering tasks a developer could pick up immediately. Order them logically (setup/foundation first, polish/testing last).

Return a JSON array where each object has these exact properties:
- "title": string (short title)
- "description": string (clear summary of work)
- "priority": "Low" | "Medium" | "High"`;

            const endpoint = `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [{ text: prompt }],
                            },
                        ],
                        generationConfig: {
                            responseMimeType: "application/json",
                            temperature: 0.2,
                        },
                    }),
                });

                if (!response.ok) {
                    const errorJson = await response.json().catch(() => null);
                    const errorMsg =
                        errorJson?.error?.message ?? `API request failed with status ${response.status}`;
                    throw new Error(`Gemini AI Error (${GEMINI_MODEL}): ${errorMsg}`);
                }

                const data = await response.json();
                const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!rawText) {
                    throw new Error("Gemini AI did not return any content.");
                }

                const tasks: AiSuggestedTask[] = JSON.parse(rawText);
                return tasks;
            } catch (err) {
                if (isQuotaExceededError(err)) {
                    console.warn("Gemini API quota exceeded. Returning local heuristic breakdown.");
                    return [
                        { title: `Set up core architecture for ${projectName}`, description: "Initial project boilerplate, routing, and environment configurations.", priority: "High" },
                        { title: "Define data models and database schemas", description: "Establish database tables, relationships, and TypeScript interfaces.", priority: "High" },
                        { title: "Implement core UI components and layouts", description: "Build main application views, forms, and responsive components.", priority: "Medium" },
                        { title: "Connect API endpoints & authentication", description: "Wire up backend services, Auth tokens, and error handling.", priority: "Medium" },
                        { title: "Write unit tests and verify build pipeline", description: "Perform integration testing and verify production deployment.", priority: "Low" },
                    ];
                }
                throw err;
            }
        },
        forceRefresh
    );
}

export async function suggestNextTask(
    tasks: Task[],
    projectName: string,
    recentCommitMessages: string[] = [],
    forceRefresh: boolean = false,
    collaboratorsCount: number = 1
): Promise<AiTaskSuggestion> {
    const uncompleted = tasks.filter((t) => t.status !== "Completed");

    if (uncompleted.length === 0) {
        throw new Error("All tasks are already completed! Add more tasks or create a new feature.");
    }

    const cacheKey = `ai_suggestion_${projectName.replace(/\s+/g, "_")}_${uncompleted.length}_collab_${collaboratorsCount}`;

    return cacheAiResponse(
        cacheKey,
        async () => {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                throw new Error(
                    "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file."
                );
            }

            const taskListText = uncompleted
                .map((t) => `- [ID: ${t.id}] ${t.title} (Priority: ${t.priority}, Status: ${t.status}): ${t.description}`)
                .join("\n");

            const commitText = recentCommitMessages.length > 0
                ? recentCommitMessages.map((c) => `- ${c}`).join("\n")
                : "No recent commits recorded.";

            const prompt = `You are an expert AI engineering manager evaluating team workload.

Project Name: ${projectName}
Active Team Collaborators: ${collaboratorsCount} member(s)

Uncompleted Tasks Available:
${taskListText}

Recent Repository Commits & Team Activity:
${commitText}

Analyze task priorities, logical engineering dependencies (e.g. data models and setup before algorithms), team capacity, and recent commit context.
Select the single best task ID for the team to work on right now.

Return a JSON object with these exact keys:
- "suggestedTaskId": string (must match one of the task IDs above)
- "suggestedTaskTitle": string (title of the task)
- "reasoning": string (2-3 sentences explaining why this task is the priority now)
- "recommendedNextSteps": string[] (array of 2 to 4 concrete action steps to execute this task)`;

            const endpoint = `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [{ text: prompt }],
                            },
                        ],
                        generationConfig: {
                            responseMimeType: "application/json",
                            temperature: 0.2,
                        },
                    }),
                });

                if (!response.ok) {
                    const errorJson = await response.json().catch(() => null);
                    const errorMsg =
                        errorJson?.error?.message ?? `API request failed with status ${response.status}`;
                    throw new Error(`Gemini AI Error: ${errorMsg}`);
                }

                const data = await response.json();
                const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!rawText) {
                    throw new Error("Gemini AI did not return any suggestion.");
                }

                const suggestion: AiTaskSuggestion = JSON.parse(rawText);
                return suggestion;
            } catch (err) {
                if (isQuotaExceededError(err)) {
                    console.warn("Gemini API quota exceeded. Returning local heuristic task suggestion.");
                    const topTask = uncompleted.find((t) => t.priority === "High") || uncompleted[0];
                    return {
                        suggestedTaskId: topTask.id,
                        suggestedTaskTitle: topTask.title,
                        reasoning: `Selected based on high priority status and uncompleted backlog ranking. (Local Heuristic Engine — API Quota Limit Exceeded)`,
                        recommendedNextSteps: [
                            "Review task requirements and open dependencies.",
                            "Execute core implementation steps.",
                            "Move task status to 'In Progress' on Kanban board.",
                        ],
                    };
                }
                throw err;
            }
        },
        forceRefresh
    );
}

export async function analyzeProjectHealth(
    project: Project,
    tasks: Task[],
    repoConnected: boolean = false,
    forceRefresh: boolean = false,
    collaboratorsCount: number = 1,
    linkedGithubCount: number = 0
): Promise<AiProjectHealth> {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "Completed").length;
    const cacheKey = `ai_health_${project.id}_${totalTasks}_${completedTasks}_collab_${collaboratorsCount}_gh_${linkedGithubCount}`;

    return cacheAiResponse(
        cacheKey,
        async () => {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                throw new Error(
                    "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file."
                );
            }

            const highPriorityCount = tasks.filter((t) => t.priority === "High" && t.status !== "Completed").length;
            const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;

            const taskSummary = tasks.map(
                (t) => `- [${t.status}] (${t.priority} priority) ${t.title}`
            ).join("\n") || "No tasks defined yet.";

            const prompt = `You are a Principal Technical Program Manager evaluating the health of a software project.

Project Name: ${project.name}
Project Status: ${project.status}
Reported Progress: ${project.progress}%
Total Tasks: ${totalTasks}
Completed Tasks: ${completedTasks}
Tasks In Progress: ${inProgressCount}
Uncompleted High-Priority Tasks: ${highPriorityCount}
Active Team Collaborators: ${collaboratorsCount} member(s)
GitHub Repository Connected: ${repoConnected ? "Yes" : "No"}
Linked GitHub Issues & Pull Requests: ${linkedGithubCount}

Task List:
${taskSummary}

Evaluate the health of this project. Consider:
1. Team capacity & active team collaborators (${collaboratorsCount} member(s))
2. Progress ratio vs total tasks (${completedTasks}/${totalTasks})
3. Uncompleted high-priority task bottleneck (${highPriorityCount} pending)
4. GitHub issues, pull requests & repository activity tracking (${linkedGithubCount} linked)
5. Project activity balance

Return a JSON object with these exact keys:
- "healthScore": number (integer from 0 to 100)
- "status": "Healthy" | "Needs Attention" | "At Risk"
- "summary": string (2-3 sentence executive summary of overall project health)
- "keyRisks": string[] (array of 2 to 4 potential risk factors or bottlenecks)
- "recommendations": string[] (array of 2 to 4 actionable recommendations for the engineering team)`;

            const endpoint = `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [{ text: prompt }],
                            },
                        ],
                        generationConfig: {
                            responseMimeType: "application/json",
                            temperature: 0.2,
                        },
                    }),
                });

                if (!response.ok) {
                    const errorJson = await response.json().catch(() => null);
                    const errorMsg =
                        errorJson?.error?.message ?? `API request failed with status ${response.status}`;
                    throw new Error(`Gemini AI Error: ${errorMsg}`);
                }

                const data = await response.json();
                const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!rawText) {
                    throw new Error("Gemini AI did not return any health analysis.");
                }

                const health: AiProjectHealth = JSON.parse(rawText);
                return health;
            } catch (err) {
                if (isQuotaExceededError(err)) {
                    console.warn("Gemini API quota exceeded. Returning local heuristic health diagnostic.");
                    const score = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progress;
                    const status = score >= 70 ? "Healthy" : score >= 35 ? "Needs Attention" : "At Risk";

                    return {
                        healthScore: Math.max(25, Math.min(100, score)),
                        status: status,
                        summary: `${project.name} has ${completedTasks} of ${totalTasks} tasks completed (${score}% completion rate) across ${collaboratorsCount} team member(s). (Local Heuristic Engine — API Quota Limit Exceeded)`,
                        keyRisks: [
                            highPriorityCount > 0 ? `${highPriorityCount} high-priority task(s) pending completion.` : "No critical high-priority bottlenecks.",
                            repoConnected ? "Repository linked." : "Connect a GitHub repository for commit tracking.",
                        ],
                        recommendations: [
                            "Prioritize high-priority Todo items.",
                            "Gemini API rate limit reached (15 req/min). Try refreshing in 30 seconds.",
                        ],
                    };
                }
                throw err;
            }
        },
        forceRefresh
    );
}

export async function generateProductivityInsights(
    tasks: Task[],
    projects: Project[],
    githubUsername?: string | null,
    forceRefresh: boolean = false
): Promise<AiProductivityInsight> {
    const completedCount = tasks.filter((t) => t.status === "Completed").length;
    const cacheKey = `ai_productivity_${tasks.length}_${completedCount}_${projects.length}`;

    return cacheAiResponse(
        cacheKey,
        async () => {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                throw new Error(
                    "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file."
                );
            }

            const totalProjects = projects.length;
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter((t) => t.status === "Completed");
            const inProgressTasks = tasks.filter((t) => t.status === "In Progress");
            const todoTasks = tasks.filter((t) => t.status === "Todo");
            const highPriorityUncompleted = tasks.filter((t) => t.priority === "High" && t.status !== "Completed");

            const prompt = `You are a Lead Developer Coach analyzing developer workspace productivity.

User Profile:
- GitHub Connected: ${githubUsername ? `Yes (@${githubUsername})` : "No"}
- Total Projects: ${totalProjects}
- Total Tasks Created: ${totalTasks}
- Completed Tasks: ${completedTasks.length}
- In Progress Tasks: ${inProgressTasks.length}
- Todo Tasks: ${todoTasks.length}
- High Priority Pending Tasks: ${highPriorityUncompleted.length}

Recent Completed Task Titles:
${completedTasks.slice(0, 5).map((t) => `- ${t.title}`).join("\n") || "No completed tasks yet."}

Current In Progress Task Titles:
${inProgressTasks.slice(0, 5).map((t) => `- ${t.title}`).join("\n") || "No in-progress tasks."}

Evaluate developer productivity and workflow momentum.

Return a JSON object with these exact keys:
- "velocityLevel": "Accelerating" | "Steady" | "Blocked" | "Starting Out"
- "summary": string (2-3 sentences summarizing development velocity and work rhythm)
- "keyAchievements": string[] (array of 2 to 3 bullet points highlighting recent wins or progress)
- "optimizationTips": string[] (array of 2 to 3 actionable tips to improve throughput and focus)`;

            const endpoint = `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [{ text: prompt }],
                            },
                        ],
                        generationConfig: {
                            responseMimeType: "application/json",
                            temperature: 0.2,
                        },
                    }),
                });

                if (!response.ok) {
                    const errorJson = await response.json().catch(() => null);
                    const errorMsg =
                        errorJson?.error?.message ?? `API request failed with status ${response.status}`;
                    throw new Error(`Gemini AI Error: ${errorMsg}`);
                }

                const data = await response.json();
                const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!rawText) {
                    throw new Error("Gemini AI did not return any productivity insights.");
                }

                const insight: AiProductivityInsight = JSON.parse(rawText);
                return insight;
            } catch (err) {
                if (isQuotaExceededError(err)) {
                    console.warn("Gemini API quota exceeded. Returning local heuristic productivity insight.");
                    const ratio = totalTasks > 0 ? completedTasks.length / totalTasks : 0;
                    let velocity: "Accelerating" | "Steady" | "Blocked" | "Starting Out" = "Starting Out";
                    if (ratio >= 0.5) velocity = "Accelerating";
                    else if (ratio >= 0.2) velocity = "Steady";
                    else if (totalTasks > 5 && ratio < 0.1) velocity = "Blocked";

                    return {
                        velocityLevel: velocity,
                        summary: `Workspace has ${totalProjects} active project(s) and ${totalTasks} task(s) with ${completedTasks.length} completed (${Math.round(ratio * 100)}% completion rate). (Local Heuristic Engine — API Quota Limit Exceeded)`,
                        keyAchievements: [
                            `Completed ${completedTasks.length} workspace task(s) across active projects.`,
                            githubUsername ? `Synced GitHub commits for @${githubUsername}.` : "Workspace repository integrations active.",
                        ],
                        optimizationTips: [
                            "Focus on moving high-priority 'In Progress' tasks to 'Completed'.",
                            "Gemini API rate limit reached (15 req/min). Try refreshing insights in 30 seconds.",
                        ],
                    };
                }
                throw err;
            }
        },
        forceRefresh
    );
}
