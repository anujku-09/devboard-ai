import { supabase } from "../lib/supabase";
import { getProjects } from "./projectService";
import type { Task } from "../types/task";

type TaskRow = {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string;
  status: "Todo" | "In Progress" | "Completed";
  priority: "Low" | "Medium" | "High";
  due_date: string | null;
  created_at: string;
};

function mapTask(task: TaskRow): Task {
  return {
    id: task.id,
    projectId: task.project_id,
    userId: task.user_id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.due_date,
    createdAt: task.created_at,
  };
}

function getUserFacingError(error: unknown): Error {
  if (typeof error === "object" && error !== null) {
    const maybeError = error as { code?: string; message?: string; details?: string; hint?: string };
    const message = maybeError.message?.toLowerCase() ?? "";

    if (maybeError.code === "42501" || message.includes("permission denied") || message.includes("row level security")) {
      return new Error(
        "Supabase is blocking task writes. Run the SQL from supabase/schema.sql in the Supabase SQL editor so the tasks table has the correct permissions and policies."
      );
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Failed to complete the task request.");
}

export async function getTasks(): Promise<Task[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return [];

  // Fetch all projects accessible to this user (owned or collaborated)
  const projects = await getProjects();
  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return (data ?? []).map(mapTask);
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false });

  if (error) {
    // Fallback to user_id tasks if project in query fails
    const { data: userTasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return (userTasks ?? []).map(mapTask);
  }

  return (data ?? []).map(mapTask);
}

export async function createTask(task: Omit<Task, "id" | "createdAt">): Promise<Task> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to create a task.");

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: task.projectId,
      user_id: user.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.dueDate,
    })
    .select()
    .single();

  if (error) throw getUserFacingError(error);
  return mapTask(data as TaskRow);
}

export async function updateTask(task: Partial<Omit<Task, "createdAt">> & { id: string }): Promise<Task> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to update a task.");

  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.dueDate,
    })
    .eq("id", task.id)
    .select()
    .single();

  if (error) throw getUserFacingError(error);
  return mapTask(data as TaskRow);
}

export async function deleteTask(id: string): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to delete a task.");

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id);

  if (error) throw getUserFacingError(error);
}
