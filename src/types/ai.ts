import type { TaskPriority } from "./task";

export interface AiSuggestedTask {
    title: string;
    description: string;
    priority: TaskPriority;
}

export interface AiTaskSuggestion {
    suggestedTaskId: string;
    suggestedTaskTitle: string;
    reasoning: string;
    recommendedNextSteps: string[];
}

export interface AiProjectHealth {
    healthScore: number;
    status: "Healthy" | "Needs Attention" | "At Risk";
    summary: string;
    keyRisks: string[];
    recommendations: string[];
}

export interface AiProductivityInsight {
    velocityLevel: "Accelerating" | "Steady" | "Blocked" | "Starting Out";
    summary: string;
    keyAchievements: string[];
    optimizationTips: string[];
}
