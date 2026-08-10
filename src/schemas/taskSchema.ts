import { z } from "zod";

export const taskSchema = z.object({
  projectId: z.string().min(1, "Please select a project."),
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  status: z.enum(["Todo", "In Progress", "Completed"]),
  priority: z.enum(["Low", "Medium", "High"]),
  dueDate: z.string().nullable().optional(),
});

export type TaskFormData =z.infer<typeof taskSchema>;