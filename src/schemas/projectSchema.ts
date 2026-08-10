import { z } from "zod";

export const projectStatuses = ["Active","Completed","On Hold",] as const;

export const projectSchema = z.object({
    name: z.string().min(3, "Project name must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    status: z.enum(projectStatuses),
    progress: z.number({ error: "Progress must be a number" }).min(0, "Progress cannot be below 0").max(100, "Progress cannot exceed 100"),
});

export type ProjectFormData =z.infer<typeof projectSchema>;