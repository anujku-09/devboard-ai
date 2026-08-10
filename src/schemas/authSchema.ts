import { z } from "zod";

const usernameField = z.string().min(3, "Username must be at least 3 characters.").max(24, "Username must be at most 24 characters.").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed."
    );

export const usernameSchema = z.object({
    username: usernameField,
});

export type UsernameFormData = z.infer<typeof usernameSchema>;

export const passwordChangeSchema = z
    .object({
        password: z.string().min(6, "Password must be at least 6 characters."),
        confirmPassword: z.string().min(1, "Please confirm your password."),
    })
    .refine((data) => data.password === data.confirmPassword, {message: "Passwords do not match.",path: ["confirmPassword"],});

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

export const loginSchema = z.object({
    email: z.string().min(1, "Email is required.").email("Invalid email address."),
    password: z.string().min(1, "Password is required.").min(6, "Password must be at least 6 characters."),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
    .object({
        username: usernameField,
        email: z.string().min(1, "Email is required.").email("Invalid email address."),

        password: z.string().min(6, "Password must be at least 6 characters."),
        confirmPassword: z.string().min(1, "Please confirm your password."),
    })
    .refine((data) => data.password === data.confirmPassword, {message: "Passwords do not match.",path: ["confirmPassword"],
    });

export type SignupFormData = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address.")
});
export type ForgotPasswordFormData =
    z.infer<typeof forgotPasswordSchema>;
