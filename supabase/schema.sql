create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    name text not null,
    description text not null,
    status text not null default 'Active' check (status in ('Active', 'Completed', 'On Hold')),
    progress integer not null default 0 check (progress between 0 and 100),
    created_at timestamptz not null default now()
);

alter table public.projects add column if not exists user_id uuid;

alter table public.projects enable row level security;

grant select, insert, update, delete on public.projects to authenticated;

drop policy if exists "Users can view their own projects" on public.projects;
drop policy if exists "Users can insert their own projects" on public.projects;
drop policy if exists "Users can update their own projects" on public.projects;
drop policy if exists "Users can delete their own projects" on public.projects;

create policy "Users can view their own projects"
    on public.projects for select
    using (auth.uid() = user_id);

create policy "Users can insert their own projects"
    on public.projects for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own projects"
    on public.projects for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own projects"
    on public.projects for delete
    using (auth.uid() = user_id);

create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),

    project_id uuid not null
        references public.projects(id) on delete cascade,

    user_id uuid not null
        references auth.users(id) on delete cascade,

    title text not null,
    description text not null,
    status text not null
        check (
            status in ( 'Todo', 'In Progress', 'Completed')
        ),
    priority text not null
        check (
            priority in ( 'Low', 'Medium', 'High')
        ),
    due_date date,
    created_at timestamptz
        default now()
);

alter table public.tasks enable row level security;

grant select, insert, update, delete on public.tasks to authenticated;

drop policy if exists "Users can view their own tasks" on public.tasks;
drop policy if exists "Users can insert their own tasks" on public.tasks;
drop policy if exists "Users can update their own tasks" on public.tasks;
drop policy if exists "Users can delete their own tasks" on public.tasks;

create policy "Users can view their own tasks"
    on public.tasks for select
    using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
    on public.tasks for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
    on public.tasks for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own tasks"
    on public.tasks for delete
    using (auth.uid() = user_id);

create table if not exists public.github_connections (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null unique
        references auth.users(id) on delete cascade,

    github_user_id text not null,
    github_username text not null,
    avatar_url text,
    access_token text not null,
    scope text,

    connected_at timestamptz not null default now()
);

alter table public.github_connections enable row level security;

grant select, insert, update, delete on public.github_connections to authenticated;

drop policy if exists "Users can view their own github connection" on public.github_connections;
drop policy if exists "Users can insert their own github connection" on public.github_connections;
drop policy if exists "Users can update their own github connection" on public.github_connections;
drop policy if exists "Users can delete their own github connection" on public.github_connections;

create policy "Users can view their own github connection"
    on public.github_connections for select
    using (auth.uid() = user_id);

create policy "Users can insert their own github connection"
    on public.github_connections for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own github connection"
    on public.github_connections for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own github connection"
    on public.github_connections for delete
    using (auth.uid() = user_id);

create table if not exists public.repository_connections (
    id uuid primary key default gen_random_uuid(),

    project_id uuid not null unique
        references public.projects(id) on delete cascade,

    user_id uuid not null
        references auth.users(id) on delete cascade,

    github_repo_id bigint not null,
    full_name text not null,
    name text not null,
    owner text not null,
    is_private boolean not null default false,
    html_url text not null,
    default_branch text not null default 'main',

    connected_at timestamptz not null default now()
);

alter table public.repository_connections enable row level security;

grant select, insert, update, delete on public.repository_connections to authenticated;

drop policy if exists "Users can view their own repository connections" on public.repository_connections;
drop policy if exists "Users can insert their own repository connections" on public.repository_connections;
drop policy if exists "Users can update their own repository connections" on public.repository_connections;
drop policy if exists "Users can delete their own repository connections" on public.repository_connections;

create policy "Users can view their own repository connections"
    on public.repository_connections for select
    using (auth.uid() = user_id);

create policy "Users can insert their own repository connections"
    on public.repository_connections for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own repository connections"
    on public.repository_connections for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own repository connections"
    on public.repository_connections for delete
    using (auth.uid() = user_id);

create index if not exists repository_connections_project_id_idx
    on public.repository_connections (project_id);


create table if not exists public.task_github_links (
    id uuid primary key default gen_random_uuid(),

    task_id uuid not null unique
        references public.tasks(id) on delete cascade,

    user_id uuid not null
        references auth.users(id) on delete cascade,

    link_type text not null check (link_type in ('issue', 'pull_request')),
    github_number integer not null,
    title text not null,
    state text not null,
    html_url text not null,

    linked_at timestamptz not null default now()
);

alter table public.task_github_links enable row level security;

grant select, insert, update, delete on public.task_github_links to authenticated;

drop policy if exists "Users can view their own task github links" on public.task_github_links;
drop policy if exists "Users can insert their own task github links" on public.task_github_links;
drop policy if exists "Users can update their own task github links" on public.task_github_links;
drop policy if exists "Users can delete their own task github links" on public.task_github_links;

create policy "Users can view their own task github links"
    on public.task_github_links for select
    using (auth.uid() = user_id);

create policy "Users can insert their own task github links"
    on public.task_github_links for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own task github links"
    on public.task_github_links for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own task github links"
    on public.task_github_links for delete
    using (auth.uid() = user_id);

create index if not exists task_github_links_task_id_idx
    on public.task_github_links (task_id);


-- 1. Create project_collaborators table
CREATE TABLE IF NOT EXISTS public.project_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Contributor', 'Viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS Policies for Access Control
CREATE POLICY "Allow authenticated users to read collaborators"
    ON public.project_collaborators FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert collaborators"
    ON public.project_collaborators FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete collaborators"
    ON public.project_collaborators FOR DELETE
    TO authenticated
    USING (true);