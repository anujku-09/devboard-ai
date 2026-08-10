import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { useProjectCollaborators } from "../../hooks/useProjectCollaborators";
import InviteCollaboratorModal from "./InviteCollaboratorModal";
import type { Project } from "../../types/project";

interface CollaboratorAvatarStackProps {
    project: Project;
    maxVisible?: number;
    showAddButton?: boolean;
}

function CollaboratorAvatarStack({ project, maxVisible = 3, showAddButton = true }: CollaboratorAvatarStackProps) {
    const { collaborators } = useProjectCollaborators(project.id);
    const [modalOpen, setModalOpen] = useState(false);

    const visible = collaborators.slice(0, maxVisible);
    const overflowCount = Math.max(0, collaborators.length - maxVisible);

    return (
        <>
            <div className="flex items-center gap-1.5 shrink-0">
                {/* Avatar Circles Stack */}
                {collaborators.length > 0 && (
                    <div className="flex items-center -space-x-2 overflow-hidden">
                        {visible.map((collab) => {
                            const initial = collab.email.charAt(0).toUpperCase();
                            return (
                                <div
                                    key={collab.id}
                                    className="h-7 w-7 rounded-full bg-ember text-ink flex items-center justify-center font-bold font-mono text-[10px] border-2 border-white dark:border-surface-dark shadow-xs truncate shrink-0"
                                    title={`${collab.email} (${collab.role})`}
                                >
                                    {initial}
                                </div>
                            );
                        })}

                        {overflowCount > 0 && (
                            <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold font-mono text-[10px] border-2 border-white dark:border-surface-dark shadow-xs shrink-0">
                                +{overflowCount}
                            </div>
                        )}
                    </div>
                )}

                {/* Invite / Manage Button */}
                {showAddButton && (
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-dark-raised text-slate-700 dark:text-slate-200 hover:text-ember hover:border-ember/40 text-xs font-semibold transition-colors shrink-0"
                        title="Manage Project Team Collaborators"
                    >
                        {collaborators.length > 0 ? (
                            <>
                                <Users size={13} className="text-ember shrink-0" />
                                <span>{collaborators.length} Team</span>
                            </>
                        ) : (
                            <>
                                <UserPlus size={13} className="text-ember shrink-0" />
                                <span>+ Team</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Invite Collaborator Modal */}
            <InviteCollaboratorModal
                open={modalOpen}
                project={project}
                onClose={() => setModalOpen(false)}
            />
        </>
    );
}

export default CollaboratorAvatarStack;
