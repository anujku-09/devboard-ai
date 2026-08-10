import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, UserPlus, Users, Trash2, Mail, ShieldCheck, ShieldAlert, Eye } from "lucide-react";

import { useProjectCollaborators } from "../../hooks/useProjectCollaborators";
import { useAuth } from "../../hooks/useAuth";
import type { Project, CollaboratorRole } from "../../types/project";

interface InviteCollaboratorModalProps {
    open: boolean;
    project: Project;
    onClose: () => void;
}

const roleBadges: Record<CollaboratorRole, { label: string; style: string; icon: React.ReactNode }> = {
    Admin: {
        label: "Admin",
        style: "bg-ember/15 text-ember border-ember/30",
        icon: <ShieldAlert size={12} />,
    },
    Contributor: {
        label: "Contributor",
        style: "bg-signal/15 text-signal border-signal/30",
        icon: <ShieldCheck size={12} />,
    },
    Viewer: {
        label: "Viewer",
        style: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        icon: <Eye size={12} />,
    },
};

function InviteCollaboratorModal({ open, project, onClose }: InviteCollaboratorModalProps) {
    const { user } = useAuth();
    const { collaborators, loading, error, addCollaborator, removeCollaborator } = useProjectCollaborators(project.id);

    const [email, setEmail] = useState("");
    const [role, setRole] = useState<CollaboratorRole>("Contributor");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail) {
            setFormError("Please enter a valid email address.");
            return;
        }

        if (user?.email && user.email.toLowerCase() === cleanEmail) {
            setFormError("You cannot invite yourself to your own project.");
            return;
        }

        if (collaborators.some((c) => c.email.toLowerCase() === cleanEmail)) {
            setFormError("This email address has already been added to the team.");
            return;
        }

        setSubmitting(true);
        setFormError(null);

        try {
            await addCollaborator(cleanEmail, role);
            setEmail("");
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Failed to invite collaborator.");
        } finally {
            setSubmitting(false);
        }
    }

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={(event) => event.stopPropagation()}
                        className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-lg p-4 sm:p-6 max-h-[85vh] flex flex-col space-y-4"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <span className="p-2 rounded-xl bg-ember/10 text-ember shrink-0">
                                    <Users size={20} />
                                </span>
                                <div>
                                    <h2 className="font-display text-base sm:text-xl font-semibold text-slate-900 dark:text-white">
                                        Project Collaborators
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Team access & permissions for <span className="font-medium text-slate-700 dark:text-slate-200">{project.name}</span>
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Add Collaborator Form */}
                        <form onSubmit={handleInvite} className="space-y-3 p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-surface-dark-raised/40">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <UserPlus size={13} className="text-ember" />
                                Invite New Team Member
                            </p>

                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="colleague@company.com"
                                        className="w-full rounded-xl pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-ember/20 focus:border-ember transition-colors"
                                    />
                                </div>

                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as CollaboratorRole)}
                                    className="rounded-xl px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
                                >
                                    <option value="Contributor">Contributor</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Viewer">Viewer</option>
                                </select>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-ember text-ink text-xs font-semibold hover:bg-ember-dark transition-colors disabled:opacity-50 shrink-0 shadow-xs"
                                >
                                    {submitting ? "Inviting..." : "Invite"}
                                </button>
                            </div>

                            {(formError || error) && (
                                <p className="text-xs text-danger font-medium">{formError || error}</p>
                            )}
                        </form>

                        {/* Existing Team Members List */}
                        <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
                            <div className="flex items-center justify-between px-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Active Team Members ({collaborators.length})
                                </p>
                            </div>

                            {loading ? (
                                <div className="space-y-2">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="h-12 rounded-xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
                                    ))}
                                </div>
                            ) : collaborators.length === 0 ? (
                                <div className="p-6 text-center rounded-2xl border border-dashed border-slate-300 dark:border-white/10 text-xs text-slate-400">
                                    No team members invited yet. Invite your first colleague above!
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {collaborators.map((collab) => {
                                        const initial = collab.email.charAt(0).toUpperCase();
                                        const badge = roleBadges[collab.role];

                                        return (
                                            <div
                                                key={collab.id}
                                                className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-surface-dark-raised/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                    <div className="h-8 w-8 rounded-full bg-ember/15 text-ember flex items-center justify-center font-bold font-mono text-xs border border-ember/20 shrink-0">
                                                        {initial}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                                            {collab.email}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            Added {new Date(collab.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.style}`}>
                                                        {badge.icon}
                                                        <span>{badge.label}</span>
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() => void removeCollaborator(collab.id)}
                                                        className="p-1 rounded text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors"
                                                        title="Remove collaborator"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default InviteCollaboratorModal;
