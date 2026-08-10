import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { GithubConnection } from "../types/github";

const GITHUB_OAUTH_SCOPES = "read:user repo";

type GithubIdentityData = {
    user_name?: string;
    preferred_username?: string;
    avatar_url?: string;
    sub?: string;
};

interface GithubConnectionRow {
    id: string;
    user_id: string;
    github_user_id: string;
    github_username: string;
    avatar_url: string | null;
    scope: string | null;
    connected_at: string;
}

function mapConnection(row: GithubConnectionRow): GithubConnection {
    return {
        id: row.id,
        userId: row.user_id,
        githubUserId: row.github_user_id,
        githubUsername: row.github_username,
        avatarUrl: row.avatar_url,
        scope: row.scope,
        connectedAt: row.connected_at,
    };
}

/**
 * Starts the GitHub identity-linking flow for the currently signed-in user.
 * Supabase redirects the browser to GitHub and back; the resulting
 * provider_token is captured by `watchForGithubProviderToken` below, since
 * Supabase only ever exposes it once, on the auth state change event that
 * follows the redirect (it is never persisted in the stored session).
 */
export async function connectGithub(): Promise<void> {
    const { error } = await supabase.auth.linkIdentity({
        provider: "github",
        options: {
            scopes: GITHUB_OAUTH_SCOPES,
            redirectTo: `${window.location.origin}/settings`,
        },
    });

    if (error) throw error;
}

/**
 * Registers a one-time listener for the post-redirect auth event carrying
 * a fresh GitHub provider_token, and persists it to `github_connections`
 * as soon as it appears. Safe to call on every app load — it's a no-op
 * whenever no provider_token is present on the event.
 */
export function watchForGithubProviderToken(
    onConnected: (connection: GithubConnection) => void
): () => void {
    const { data: subscription } = supabase.auth.onAuthStateChange(
        (_event, session) => {
            void persistProviderTokenFromSession(session).then((connection) => {
                if (connection) {
                    onConnected(connection);
                }
            });
        }
    );

    return () => subscription.subscription.unsubscribe();
}

async function persistProviderTokenFromSession(
    session: Session | null
): Promise<GithubConnection | null> {
    const providerToken = session?.provider_token;
    if (!session || !providerToken) {
        return null;
    }

    const identity = session.user.identities?.find((item) => item.provider === "github");
    if (!identity) {
        return null;
    }

    const identityData = identity.identity_data as GithubIdentityData | undefined;
    const githubUsername = identityData?.user_name ?? identityData?.preferred_username ?? "unknown";
    const githubUserId = identityData?.sub ?? identity.id;

    const { data, error } = await supabase
        .from("github_connections")
        .upsert(
            {
                user_id: session.user.id,
                github_user_id: githubUserId,
                github_username: githubUsername,
                avatar_url: identityData?.avatar_url ?? null,
                access_token: providerToken,
                scope: GITHUB_OAUTH_SCOPES,
                connected_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
        )
        .select()
        .single();

    if (error) throw error;
    return mapConnection(data as GithubConnectionRow);
}

export async function getGithubConnection(): Promise<GithubConnection | null> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) return null;

    const { data, error } = await supabase
        .from("github_connections")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapConnection(data as GithubConnectionRow);
}

/**
 * Returns the raw GitHub access token for the current user, for use only
 * by services that call the GitHub REST API directly (see
 * githubApiService.ts). Never surfaced through the public GithubConnection
 * type — UI code should not have access to the raw token.
 */
export async function getGithubAccessToken(): Promise<string | null> {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!user) return null;

    const { data, error } = await supabase
        .from("github_connections")
        .select("access_token")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) throw error;
    return (data as { access_token: string } | null)?.access_token ?? null;
}

export async function disconnectGithub(): Promise<void> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) return;

  const { error } = await supabase
    .from("github_connections")
    .delete()
    .eq("user_id", user.id);
  if (error) throw error;

  const githubIdentity = user.identities?.find((identity) => identity.provider === "github");
  if (githubIdentity) {
    const { error: unlinkError } = await supabase.auth.unlinkIdentity(githubIdentity);
    if (unlinkError) throw unlinkError;
  }

  await supabase.auth.refreshSession();
}
