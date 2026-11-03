import type { AiProductivityInsight, AiProjectHealth, AiSuggestedTask, AiTaskSuggestion } from "../types/ai";
import type { Project } from "../types/project";
import type { Task } from "../types/task";

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-1.5-flash";
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
    model: string,
    prompt: string,
    apiKey: string
): Promise<string> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
 * fallback between gemini-2.5-flash and gemini-1.5-flash.
 */
async function callGeminiWithRetry(prompt: string): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file."
        );
    }

    const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL];
    let lastError: RequestError | null = null;

    for (const model of modelsToTry) {
        const maxRetries = 2; // 3 attempts per model
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await executeGeminiRequest(model, prompt, apiKey);
            } catch (err: unknown) {
                const requestError: RequestError =
                    err instanceof Error ? err : new Error(String(err));
                lastError = requestError;
                const status = requestError.status ?? 0;
                const message = requestError.message;

                const retryable = isRetryableError(status, message);
                if (!retryable || attempt === maxRetries) {
                    console.warn(`[Gemini AI] Model ${model} attempt ${attempt + 1} failed: ${message}`);
                    break; // Move to fallback model
                }

                // Exponential backoff: 1s, 2s
                const backoffMs = 1000 * Math.pow(2, attempt);
                console.log(`[Gemini AI] ${message}. Retrying ${model} in ${backoffMs}ms...`);
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
    const cacheKey = `ai_breakdown_${projectName.replace(/\s+/g, "_")}`;

    return cacheAiResponse(
        cacheKey,
        async () => {
            const prompt = `You are a senior engineering lead breaking a software project into an actionable task list.

Project Name: ${projectName}
Project Description: ${projectDescription || "No description provided."}

Break this project into 5 to 10 concrete, actionable engineering tasks a developer could pick up immediately. Order them logically (setup/foundation first, polish/testing last).

Return a JSON array where each object has these exact properties:
- "title": string (short title)
- "description": string (clear summary of work)
- "priority": "Low" | "Medium" | "High"`;

            const rawText = await callGeminiWithRetry(prompt);
            const tasks: AiSuggestedTask[] = JSON.parse(rawText);
            return tasks;
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

            const rawText = await callGeminiWithRetry(prompt);
            const suggestion: AiTaskSuggestion = JSON.parse(rawText);
            return suggestion;
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

            const rawText = await callGeminiWithRetry(prompt);
            const health: AiProjectHealth = JSON.parse(rawText);
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
    const completedCount = tasks.filter((t) => t.status === "Completed").length;
    const cacheKey = `ai_productivity_${tasks.length}_${completedCount}_${projects.length}`;

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

            const rawText = await callGeminiWithRetry(prompt);
            const insight: AiProductivityInsight = JSON.parse(rawText);
            return insight;
        },
        forceRefresh
    );
}
