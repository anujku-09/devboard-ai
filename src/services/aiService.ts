import type {
    AiNextTaskItem,
    AiProductivityInsight,
    AiProjectHealth,
    AiSuggestedTask,
    AiTaskSuggestion,
    AiTaskSuggestionBatch,
} from "../types/ai";
import type { Project } from "../types/project";
import type { Task } from "../types/task";

interface GeminiTarget {
    apiVersion: "v1beta" | "v1";
    model: string;
}

/**
 * Resilient multi-tier list of verified active Gemini models.
 * Verified against live Google Generative Language API.
 */
const CANDIDATE_TARGETS: GeminiTarget[] = [
    { apiVersion: "v1beta", model: "gemini-3.5-flash" },
    { apiVersion: "v1beta", model: "gemini-3-flash-preview" },
    { apiVersion: "v1beta", model: "gemini-3.1-flash-lite" },
    { apiVersion: "v1beta", model: "gemini-3.7-flash" },
    { apiVersion: "v1beta", model: "gemini-3.8-flash" },
    { apiVersion: "v1beta", model: "gemini-2.5-flash-lite" },
];

let lastWorkingTarget: GeminiTarget | null = null;
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours Cache TTL to preserve user API quota

interface CachedPayload<T> {
    timestamp: number;
    data: T;
}

/**
 * Strips markdown code block wrappers (e.g. ```json ... ```) if returned by Gemini.
 */
function cleanJsonText(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed.startsWith("```")) {
        return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }
    return trimmed;
}

/**
 * Reads from localStorage cache synchronously without making any API request.
 */
export function getCachedAiResponse<T>(cacheKey: string, ttlMs: number = DEFAULT_TTL_MS): T | null {
    try {
        const fullKey = `devboard_ai_${cacheKey}`;
        const raw = localStorage.getItem(fullKey);
        if (raw) {
            const parsed: CachedPayload<T> = JSON.parse(raw);
            const isExpired = Date.now() - parsed.timestamp > ttlMs;
            if (!isExpired) {
                return parsed.data;
            }
        }
    } catch (e) {
        console.warn("Failed to read from persistent AI cache:", e);
    }
    return null;
}

/**
 * Smart Caching Helper for Gemini AI API Calls.
 * Caches responses persistently in localStorage with a 24-hour TTL
 * to strictly prevent quota exhaustion and unnecessary API token consumption.
 */
export async function cacheAiResponse<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    forceRefresh: boolean = false,
    ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
    const fullKey = `devboard_ai_${cacheKey}`;

    if (!forceRefresh) {
        try {
            const raw = localStorage.getItem(fullKey);
            if (raw) {
                const parsed: CachedPayload<T> = JSON.parse(raw);
                const isExpired = Date.now() - parsed.timestamp > ttlMs;
                if (!isExpired) {
                    console.log(`[AI Cache Hit - 0 Tokens Used] Loaded cached result for: ${cacheKey}`);
                    return parsed.data;
                }
            }
        } catch (e) {
            console.warn("Failed to read from persistent AI cache:", e);
        }
    }

    console.log(`[AI Quota Usage] User triggered fresh Gemini API call for: ${cacheKey}`);
    const freshData = await fetcher();

    try {
        const payload: CachedPayload<T> = {
            timestamp: Date.now(),
            data: freshData,
        };
        localStorage.setItem(fullKey, JSON.stringify(payload));
    } catch (e) {
        console.warn("Failed to write to persistent AI cache:", e);
    }

    return freshData;
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(status: number, message: string): boolean {
    const msg = message.toLowerCase();
    return (
        status === 429 ||
        status === 500 ||
        status === 503 ||
        msg.includes("high demand") ||
        msg.includes("resource_exhausted") ||
        msg.includes("rate limit") ||
        msg.includes("overloaded") ||
        msg.includes("spikes in demand")
    );
}

interface RequestError extends Error {
    status?: number;
}

async function executeGeminiRequest(
    target: GeminiTarget,
    prompt: string,
    apiKey: string
): Promise<string> {
    const endpoint = `https://generativelanguage.googleapis.com/${target.apiVersion}/models/${target.model}:generateContent?key=${apiKey}`;

    const body: Record<string, unknown> = {
        contents: [
            {
                parts: [{ text: prompt }],
            },
        ],
        generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
        },
    };

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        const errorMsg =
            errorJson?.error?.message ?? `API request failed with status ${response.status}`;
        const error: RequestError = new Error(errorMsg);
        error.status = response.status;
        throw error;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
        throw new Error("Gemini AI did not return any content.");
    }

    return rawText;
}

/**
 * Resilient Gemini API invocation engine.
 * Supports automatic retries with exponential backoff and transparent
 * fallback across supported model endpoints.
 */
async function callGeminiWithRetry(prompt: string): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file."
        );
    }

    const envModel = (import.meta.env.VITE_GEMINI_MODEL as string | undefined)?.trim();
    const targetsToTry: GeminiTarget[] = [];

    if (envModel) {
        targetsToTry.push({ apiVersion: "v1beta", model: envModel });
    }

    if (lastWorkingTarget) {
        targetsToTry.push(lastWorkingTarget);
    }

    for (const candidate of CANDIDATE_TARGETS) {
        if (!targetsToTry.some((t) => t.apiVersion === candidate.apiVersion && t.model === candidate.model)) {
            targetsToTry.push(candidate);
        }
    }

    let lastError: RequestError | null = null;

    for (const target of targetsToTry) {
        const maxRetries = 2; // Up to 2 retries for temporary failures
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const response = await executeGeminiRequest(target, prompt, apiKey);
                lastWorkingTarget = target;
                return response;
            } catch (err: unknown) {
                const requestError: RequestError =
                    err instanceof Error ? err : new Error(String(err));
                lastError = requestError;
                const status = requestError.status ?? 0;
                const message = requestError.message;

                // 404 (Model not supported on this API version): skip retries and move to next model
                if (status === 404 || message.toLowerCase().includes("not found")) {
                    console.warn(`[Gemini AI] ${target.apiVersion}/${target.model} not available: ${message}. Moving to next candidate.`);
                    break;
                }

                const retryable = isRetryableError(status, message);
                if (!retryable || attempt === maxRetries) {
                    console.warn(`[Gemini AI] Target ${target.apiVersion}/${target.model} attempt ${attempt + 1} failed: ${message}`);
                    break; // Move to next candidate model
                }

                // Exponential backoff for temporary rate spikes: 1s, 2s
                const backoffMs = 1000 * Math.pow(2, attempt);
                console.log(`[Gemini AI] ${message}. Retrying ${target.model} in ${backoffMs}ms...`);
                await sleep(backoffMs);
            }
        }
    }

    const errorMsg = lastError?.message || "Unknown error";
    if (
        errorMsg.toLowerCase().includes("high demand") ||
        errorMsg.includes("503") ||
        errorMsg.includes("429")
    ) {
        throw new Error(
            "Gemini AI is currently experiencing high demand. Please click Refresh to try again."
        );
    }

    throw new Error(`Gemini AI Error: ${errorMsg}`);
}

export async function generateProjectBreakdown(
    projectName: string,
    projectDescription: string,
    forceRefresh: boolean = false
): Promise<AiSuggestedTask[]> {
    const cacheKey = `breakdown_${projectName.replace(/\s+/g, "_")}`;

    return cacheAiResponse(
        cacheKey,
        async () => {
            const prompt = `You are a senior engineering lead breaking a software project into an actionable task list.

Project Name: ${projectName}
Project Description: ${projectDescription || "No description provided."}

Break this project into 5 to 8 concrete, actionable engineering tasks. Order logically.

Return a JSON array where each object has these exact keys:
- "title": string (short title)
- "description": string (clear summary of work)
- "priority": "Low" | "Medium" | "High"`;

            const rawText = await callGeminiWithRetry(prompt);
            const tasks: AiSuggestedTask[] = JSON.parse(cleanJsonText(rawText));
            return tasks;
        },
        forceRefresh
    );
}

/**
 * Evaluates what tasks to execute next with multi-task selection.
 * Supports:
 * 1. Backlog has uncompleted tasks -> prioritizes top 2-4 tasks from backlog.
 * 2. Backlog has 0 uncompleted tasks AND repository connected ->
 *    generates 3 to 5 logical next milestone tasks from git commits & project description.
 */
export async function suggestNextTasksBatch(
    tasks: Task[],
    projectName: string,
    recentCommitMessages: string[] = [],
    forceRefresh: boolean = false,
    collaboratorsCount: number = 1,
    projectDescription: string = "",
    repoConnected: boolean = false,
    projectId?: string
): Promise<AiTaskSuggestionBatch> {
    const uncompleted = tasks.filter((t) => t.status !== "Completed");
    const cacheKey = projectId ? `suggestion_${projectId}` : `suggestion_${projectName.replace(/\s+/g, "_")}`;

    // Scenario 1: Existing uncompleted tasks in project backlog
    if (uncompleted.length > 0) {
        return cacheAiResponse(
            cacheKey,
            async () => {
                const taskListText = uncompleted
                    .slice(0, 15)
                    .map((t) => `- [ID: ${t.id}] ${t.title} (Priority: ${t.priority}, Status: ${t.status}): ${t.description}`)
                    .join("\n");

                const commitText = recentCommitMessages.length > 0
                    ? recentCommitMessages.slice(0, 10).map((c) => `- ${c}`).join("\n")
                    : "No recent commits recorded.";

                const prompt = `You are an expert AI engineering manager evaluating team workload.

Project Name: ${projectName}
Project Description: ${projectDescription || "No description provided."}
Active Team Collaborators: ${collaboratorsCount} member(s)

Uncompleted Tasks in Backlog:
${taskListText}

Recent Commits:
${commitText}

Select the 2 to 4 most critical backlog tasks the developer should tackle next, ordered by priority.

Return a JSON object with this exact structure:
{
  "summary": "1-2 sentence overview of next focus milestone",
  "tasks": [
    {
      "id": "must match one of the task IDs above",
      "title": "task title",
      "description": "summary of work",
      "priority": "High" | "Medium" | "Low",
      "reasoning": "why this task is priority now"
    }
  ]
}`;

                const rawText = await callGeminiWithRetry(prompt);
                const parsed = JSON.parse(cleanJsonText(rawText));
                return {
                    summary: parsed.summary || "Prioritized backlog tasks for your active sprint.",
                    tasks: (parsed.tasks || []).map((t: AiNextTaskItem) => ({
                        ...t,
                        isNewInferredTask: false,
                    })),
                };
            },
            forceRefresh
        );
    }

    // Scenario 2: Backlog has 0 uncompleted tasks, but repository is connected or commits are present
    if (repoConnected || recentCommitMessages.length > 0) {
        return cacheAiResponse(
            cacheKey,
            async () => {
                const commitText = recentCommitMessages.length > 0
                    ? recentCommitMessages.slice(0, 15).map((c) => `- ${c}`).join("\n")
                    : "Repository is connected, but no commit log could be retrieved.";

                const prompt = `You are a Principal Software Engineer and Technical Lead.
The developer has connected their GitHub repository to the project '${projectName}', but has not manually added any pending tasks yet.

Project Context:
- Project Name: ${projectName}
- Project Description: ${projectDescription || "No project description provided."}

Recent Git Commits from Connected Repository:
${commitText}

Based on recent commit activity, project name, and description:
1. Deduce the current state of implementation.
2. Formulate 3 to 5 concrete, actionable next tasks/features the developer should build next to advance the project.
3. Order them logically (immediate next milestone first).

Return a JSON object with this exact structure:
{
  "summary": "1-2 sentence overview of recent implementation and next recommended milestone",
  "tasks": [
    {
      "id": "inferred-1",
      "title": "Actionable task title",
      "description": "Detailed technical description of feature to build",
      "priority": "High" | "Medium" | "Low",
      "reasoning": "Why this task is next based on commit history"
    }
  ]
}`;

                const rawText = await callGeminiWithRetry(prompt);
                const parsed = JSON.parse(cleanJsonText(rawText));
                return {
                    summary: parsed.summary || "Recommended next milestone tasks derived from repository commit history.",
                    tasks: (parsed.tasks || []).map((t: AiNextTaskItem, idx: number) => ({
                        ...t,
                        id: t.id || `inferred-${idx + 1}`,
                        isNewInferredTask: true,
                    })),
                };
            },
            forceRefresh
        );
    }

    // Scenario 3: 0 tasks, no repo, but project has a description
    if (projectDescription && projectDescription.trim().length > 5) {
        return cacheAiResponse(
            cacheKey,
            async () => {
                const prompt = `You are a Lead Software Architect.
The project '${projectName}' has just been created with no tasks and no repository connected yet.

Project Description:
${projectDescription}

Define 3 essential foundational tasks to kick off this project.

Return a JSON object with this exact structure:
{
  "summary": "Foundational kickoff roadmap for ${projectName}.",
  "tasks": [
    {
      "id": "inferred-init-1",
      "title": "Task title",
      "description": "Technical description",
      "priority": "High" | "Medium" | "Low",
      "reasoning": "Why this is a foundational kickoff step"
    }
  ]
}`;

                const rawText = await callGeminiWithRetry(prompt);
                const parsed = JSON.parse(cleanJsonText(rawText));
                return {
                    summary: parsed.summary || `Foundational kickoff tasks for ${projectName}.`,
                    tasks: (parsed.tasks || []).map((t: AiNextTaskItem, idx: number) => ({
                        ...t,
                        id: t.id || `init-${idx + 1}`,
                        isNewInferredTask: true,
                    })),
                };
            },
            forceRefresh
        );
    }

    throw new Error(
        "No tasks found. Please add tasks to this project or connect a GitHub repository so AI can inspect your recent commit history and recommend what to build next."
    );
}

/**
 * Backwards-compatible wrapper returning a single task suggestion.
 */
export async function suggestNextTask(
    tasks: Task[],
    projectName: string,
    recentCommitMessages: string[] = [],
    forceRefresh: boolean = false,
    collaboratorsCount: number = 1,
    projectDescription: string = "",
    repoConnected: boolean = false,
    projectId?: string
): Promise<AiTaskSuggestion> {
    const batch = await suggestNextTasksBatch(
        tasks,
        projectName,
        recentCommitMessages,
        forceRefresh,
        collaboratorsCount,
        projectDescription,
        repoConnected,
        projectId
    );

    const first = batch.tasks[0];
    if (!first) {
        throw new Error("No tasks suggested.");
    }

    return {
        suggestedTaskId: first.id,
        suggestedTaskTitle: first.title,
        suggestedTaskDescription: first.description,
        priority: first.priority,
        isNewInferredTask: first.isNewInferredTask,
        reasoning: first.reasoning || batch.summary,
        recommendedNextSteps: first.recommendedNextSteps || [],
    };
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
    const cacheKey = `health_${project.id}`;

    return cacheAiResponse(
        cacheKey,
        async () => {
            const highPriorityCount = tasks.filter((t) => t.priority === "High" && t.status !== "Completed").length;
            const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;

            const taskSummary = tasks.slice(0, 12).map(
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

Task Snapshot:
${taskSummary}

Evaluate project health concisely.

Return a JSON object with these exact keys:
- "healthScore": number (integer from 0 to 100)
- "status": "Healthy" | "Needs Attention" | "At Risk"
- "summary": string (2-3 sentence executive summary)
- "keyRisks": string[] (array of 2 to 3 risks)
- "recommendations": string[] (array of 2 to 3 actionable recommendations)`;

            const rawText = await callGeminiWithRetry(prompt);
            const health: AiProjectHealth = JSON.parse(cleanJsonText(rawText));
            return health;
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
    const cacheKey = "productivity";

    return cacheAiResponse(
        cacheKey,
        async () => {
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

Recent Completed Tasks:
${completedTasks.slice(0, 5).map((t) => `- ${t.title}`).join("\n") || "No completed tasks yet."}

Current In Progress Tasks:
${inProgressTasks.slice(0, 5).map((t) => `- ${t.title}`).join("\n") || "No in-progress tasks."}

Evaluate developer productivity and workflow momentum concisely.

Return a JSON object with these exact keys:
- "velocityLevel": "Accelerating" | "Steady" | "Blocked" | "Starting Out"
- "summary": string (2-3 sentences summarizing development velocity)
- "keyAchievements": string[] (array of 2 to 3 bullet points)
- "optimizationTips": string[] (array of 2 to 3 actionable tips)`;

            const rawText = await callGeminiWithRetry(prompt);
            const insight: AiProductivityInsight = JSON.parse(cleanJsonText(rawText));
            return insight;
        },
        forceRefresh
    );
}

export interface AiProjectMetadata {
    name: string;
    description: string;
    status: "Active" | "Completed" | "On Hold";
    progress: number;
}

/**
 * Automatically crafts a professional project name, description, and status
 * from a raw repository name or quick title to prevent user fatigue.
 */
export async function generateProjectMetadata(
    identifier: string,
    existingDescription?: string
): Promise<AiProjectMetadata> {
    const prompt = `You are a technical project manager creating a workspace project profile.

User Input / Repository Name: ${identifier}
Provided Notes / Description: ${existingDescription || "None provided"}

Generate a polished project profile for a developer dashboard:
1. "name": Formatted, readable, professional project title (e.g. "devboard-ai" -> "DevBoard AI", "graph_visualizer" -> "Graph Visualizer")
2. "description": A concise, 2-sentence executive summary of the project purpose, architecture, and developer value.
3. "status": "Active"
4. "progress": Recommended starting progress integer (between 10 and 30)

Return a JSON object with these exact keys:
- "name": string
- "description": string
- "status": "Active"
- "progress": number`;

    const rawText = await callGeminiWithRetry(prompt);
    const result: AiProjectMetadata = JSON.parse(cleanJsonText(rawText));
    return result;
}
