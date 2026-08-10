import { useEffect, useState } from "react";
import {
  getTasks,
  createTask as createTaskService,
  updateTask as updateTaskService,
  deleteTask as deleteTaskService,
} from "../services/taskService";
import type { Task } from "../types/task";

type CreateTaskInput = Omit<Task, "id" | "createdAt">;

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshTasks(): Promise<void> {
    try {
      setLoading(true);
      setError(null);

      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  async function createTask(task: CreateTaskInput): Promise<void> {
    try {
      const newTask = await createTaskService(task);
      setTasks((previous) => [newTask, ...previous]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
    }
  }

  async function updateTask(task: Task): Promise<void> {
    // 1. Optimistic instant UI update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? { ...item, ...task } : item))
    );

    try {
      // 2. Network sync in background
      const updated = await updateTaskService(task);
      setTasks((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      // Revert if network call fails
      setTasks(previousTasks);
      setError(err instanceof Error ? err.message : "Failed to update task.");
    }
  }

  async function deleteTask(id: string): Promise<void> {
    const previousTasks = [...tasks];
    setTasks((prev) => prev.filter((task) => task.id !== id));

    try {
      await deleteTaskService(id);
    } catch (err) {
      setTasks(previousTasks);
      setError(err instanceof Error ? err.message : "Failed to delete task.");
    }
  }

  useEffect(() => {
    refreshTasks();
  }, []);

  return {
    tasks,
    loading,
    error,
    refreshTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}
