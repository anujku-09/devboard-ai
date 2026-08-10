import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
    Sun,
    Moon,
    Mail,
    GitBranch,
    Unlink,
    User,
    KeyRound,
    ShieldCheck,
    Check,
    Sparkles,
    Laptop,
    Database,
    Bot,
} from "lucide-react";

import Input from "../components/Input";
import Button from "../components/Button";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../hooks/useToast";
import { useGithubConnection } from "../hooks/useGithubConnection";
import { getDisplayName, getInitial } from "../utils/user";
import {
    usernameSchema,
    passwordChangeSchema,
} from "../schemas/authSchema";
import type {
    UsernameFormData,
    PasswordChangeFormData,
} from "../schemas/authSchema";

type TabOption = "profile" | "integrations" | "appearance";

function Settings() {
    const { user, updateUsername, updatePassword } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<TabOption>("profile");

    const {
        connection: githubConnection,
        loading: githubLoading,
        connecting: githubConnecting,
        error: githubError,
        connect: connectGithub,
        disconnect: disconnectGithub,
    } = useGithubConnection();

    const usernameForm = useForm<UsernameFormData>({
        resolver: zodResolver(usernameSchema),
        defaultValues: { username: getDisplayName(user) },
    });

    const passwordForm = useForm<PasswordChangeFormData>({
        resolver: zodResolver(passwordChangeSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    async function onUpdateUsername(data: UsernameFormData) {
        try {
            await updateUsername(data.username);
            showToast("Username updated successfully", "success");
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Failed to update username";
            showToast(message, "error");
        }
    }

    async function onUpdatePassword(data: PasswordChangeFormData) {
        try {
            await updatePassword(data.password);
            showToast("Password updated successfully", "success");
            passwordForm.reset({ password: "", confirmPassword: "" });
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Failed to update password";
            showToast(message, "error");
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 sm:space-y-6 max-w-5xl mx-auto overflow-hidden"
        >
            {/* Mobile-Optimized 3-Column Navigation Tabs */}
            <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-surface-dark-raised border border-slate-200 dark:border-white/10 w-full sm:w-auto text-center">
                <button
                    type="button"
                    onClick={() => setActiveTab("profile")}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === "profile"
                            ? "bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                    <User size={14} className="shrink-0" />
                    <span className="truncate">
                        <span className="sm:hidden">Profile</span>
                        <span className="hidden sm:inline">Profile & Security</span>
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("integrations")}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === "integrations"
                            ? "bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                    <GitBranch size={14} className="shrink-0" />
                    <span className="truncate">Integrations</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("appearance")}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        activeTab === "appearance"
                            ? "bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                    <Laptop size={14} className="shrink-0" />
                    <span className="truncate">Preferences</span>
                </button>
            </div>

            {/* TAB 1: Profile & Security */}
            {activeTab === "profile" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* User Profile Info */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs p-4 sm:p-6 space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                            <div className="h-12 w-12 rounded-2xl bg-ember text-ink flex items-center justify-center font-bold font-mono text-lg shadow-sm border-2 border-white dark:border-surface-dark">
                                {getInitial(user)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="font-display font-bold text-slate-900 dark:text-white text-base sm:text-lg truncate">
                                    {getDisplayName(user)}
                                </h2>
                                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <span className="h-2 w-2 rounded-full bg-signal animate-pulse" />
                                    <span>Active Developer Account</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised min-w-0">
                            <span className="p-2 rounded-lg bg-slate-200/60 dark:bg-white/10 text-slate-500 dark:text-slate-400 shrink-0">
                                <Mail size={16} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                    Account Email
                                </p>
                                <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={usernameForm.handleSubmit(onUpdateUsername)} className="space-y-3 pt-1">
                            <Input
                                label="Display Username"
                                type="text"
                                error={usernameForm.formState.errors.username?.message}
                                {...usernameForm.register("username")}
                            />

                            <Button
                                type="submit"
                                disabled={usernameForm.formState.isSubmitting}
                                isLoading={usernameForm.formState.isSubmitting}
                                loadingText="Updating Username..."
                            >
                                Save Display Name
                            </Button>
                        </form>
                    </div>

                    {/* Change Password */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs p-4 sm:p-6 space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-white/5">
                            <span className="p-2 rounded-xl bg-ember/10 text-ember shrink-0">
                                <KeyRound size={18} />
                            </span>
                            <div>
                                <h2 className="font-display font-semibold text-slate-900 dark:text-white text-base">
                                    Security & Password
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Update your access credentials safely
                                </p>
                            </div>
                        </div>

                        <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-3">
                            <Input
                                label="New Password"
                                type="password"
                                placeholder="At least 6 characters"
                                error={passwordForm.formState.errors.password?.message}
                                {...passwordForm.register("password")}
                            />

                            <Input
                                label="Confirm New Password"
                                type="password"
                                placeholder="Re-enter new password"
                                error={passwordForm.formState.errors.confirmPassword?.message}
                                {...passwordForm.register("confirmPassword")}
                            />

                            <Button
                                type="submit"
                                variant="secondary"
                                disabled={passwordForm.formState.isSubmitting}
                                isLoading={passwordForm.formState.isSubmitting}
                                loadingText="Updating..."
                            >
                                Update Account Password
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* TAB 2: Integrations & GitHub */}
            {activeTab === "integrations" && (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs p-4 sm:p-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-signal/10 text-signal shrink-0">
                                    <GitBranch size={24} />
                                </div>
                                <div>
                                    <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                        GitHub Developer Integration
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Link your repositories to track commits, pull requests, and branch activity live inside DevBoard AI.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {githubLoading ? (
                            <div className="h-20 rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                        ) : githubConnection ? (
                            <div className="p-4 rounded-2xl border border-signal/30 bg-signal/5 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck size={20} className="text-signal shrink-0" />
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                                Connected as @{githubConnection.githubUsername}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Active OAuth Token • Repository Sync Enabled
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => void disconnectGithub()}
                                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
                                    >
                                        <Unlink size={13} />
                                        <span>Disconnect GitHub</span>
                                    </button>
                                </div>

                                <div className="pt-3 border-t border-signal/20 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1 text-signal font-medium">
                                        <Check size={13} />
                                        Commit Log Tracking
                                    </span>
                                    <span className="flex items-center gap-1 text-signal font-medium">
                                        <Check size={13} />
                                        Pull Request Sync
                                    </span>
                                    <span className="flex items-center gap-1 text-signal font-medium">
                                        <Check size={13} />
                                        Repository Cataloging
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-surface-dark-raised/30 space-y-3 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                        No GitHub Account Connected
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Connect your GitHub account to enable 1-click repository linking.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => void connectGithub()}
                                    disabled={githubConnecting}
                                    className="mt-3 sm:mt-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-ember text-ink text-xs font-semibold hover:bg-ember-dark disabled:opacity-50 transition-colors shadow-xs"
                                >
                                    {githubConnecting && (
                                        <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                    )}
                                    <span>{githubConnecting ? "Connecting..." : "Connect GitHub"}</span>
                                </button>
                            </div>
                        )}

                        {githubError && (
                            <p className="text-xs text-danger font-medium">{githubError}</p>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: Preferences & Appearance */}
            {activeTab === "appearance" && (
                <div className="space-y-4">
                    {/* Visual Theme Selection */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs p-4 sm:p-6 space-y-4">
                        <div>
                            <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                Workspace Appearance
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Select your preferred color scheme for DevBoard AI.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={() => theme === "dark" && toggleTheme()}
                                className={`p-4 rounded-2xl border text-left transition-all ${
                                    theme === "light"
                                        ? "border-ember bg-ember/5 shadow-xs ring-2 ring-ember/20"
                                        : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised hover:border-slate-300 dark:hover:border-white/20"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                                        <Sun size={18} />
                                    </span>
                                    {theme === "light" && (
                                        <span className="h-5 w-5 rounded-full bg-ember text-ink flex items-center justify-center">
                                            <Check size={12} />
                                        </span>
                                    )}
                                </div>
                                <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">Light Mode</p>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Bright, crisp developer interface</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => theme === "light" && toggleTheme()}
                                className={`p-4 rounded-2xl border text-left transition-all ${
                                    theme === "dark"
                                        ? "border-ember bg-ember/5 shadow-xs ring-2 ring-ember/20"
                                        : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised hover:border-slate-300 dark:hover:border-white/20"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                                        <Moon size={18} />
                                    </span>
                                    {theme === "dark" && (
                                        <span className="h-5 w-5 rounded-full bg-ember text-ink flex items-center justify-center">
                                            <Check size={12} />
                                        </span>
                                    )}
                                </div>
                                <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">Dark Mode</p>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Sleek, dark glassmorphism styling</p>
                            </button>
                        </div>
                    </div>

                    {/* System & Architecture Status Summary */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs p-4 sm:p-6 space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Workspace Diagnostics & Infrastructure
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised flex items-center gap-2.5">
                                <Database size={16} className="text-signal shrink-0" />
                                <div>
                                    <p className="text-[10px] text-slate-400">Database</p>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">Supabase PostgreSQL</p>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised flex items-center gap-2.5">
                                <Bot size={16} className="text-ember shrink-0" />
                                <div>
                                    <p className="text-[10px] text-slate-400">AI Intelligence</p>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">Gemini 2.5 Flash</p>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised flex items-center gap-2.5">
                                <Sparkles size={16} className="text-purple-400 shrink-0" />
                                <div>
                                    <p className="text-[10px] text-slate-400">Version</p>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">v1.0.0 AI Edition</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

export default Settings;