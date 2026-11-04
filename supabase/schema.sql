-- TaskFlow Pro database schema
-- Jalankan seluruh file ini di Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default 'Pengguna TaskFlow',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 80),
  description text,
  color text not null default 'violet' check (color in ('violet', 'blue', 'green', 'orange')),
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  assignee_id uuid references auth.users(id) on delete set null,
  title text not null check (char_length(title) between 2 and 120),
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 3000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null default 'workspace',
  entity_id uuid,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_workspace_members_user on public.workspace_members(user_id);
create index if not exists idx_workspace_members_workspace on public.workspace_members(workspace_id);
create index if not exists idx_projects_workspace on public.projects(workspace_id, created_at desc);
create index if not exists idx_tasks_workspace_status on public.tasks(workspace_id, status);
create index if not exists idx_tasks_workspace_due on public.tasks(workspace_id, due_date);
create index if not exists idx_task_comments_task on public.task_comments(task_id, created_at);
create index if not exists idx_activity_workspace on public.activity_logs(workspace_id, created_at desc);
create index if not exists idx_notifications_user on public.notifications(user_id, read_at, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace and wm.user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(target_workspace uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace
      and wm.user_id = auth.uid()
      and wm.role = any(allowed_roles)
  );
$$;

create or replace function public.can_view_profile(target_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members mine
    join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = auth.uid() and theirs.user_id = target_profile
  );
$$;

-- Automatically create a profile and a personal workspace after sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
  display_name text;
begin
  display_name := coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1), 'Pengguna TaskFlow');

  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), display_name)
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;

  insert into public.workspaces (name, created_by)
  values (display_name || ' Workspace', new.id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner')
  on conflict (workspace_id, user_id) do nothing;

  insert into public.activity_logs (workspace_id, actor_id, entity_type, description)
  values (new_workspace_id, new.id, 'workspace', 'membuat workspace pertama');

  return new;
end;
$$;

-- Prevent attaching a project from a different workspace to a task.
create or replace function public.validate_task_project_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.project_id is not null and not exists (
    select 1 from public.projects p
    where p.id = new.project_id and p.workspace_id = new.workspace_id
  ) then
    raise exception 'Project harus berasal dari workspace yang sama.';
  end if;
  return new;
end;
$$;

create or replace function public.log_task_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'done' and old.status is distinct from 'done' then
    new.completed_at = now();
  elsif new.status <> 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create or replace function public.validate_comment_task_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.tasks t
    where t.id = new.task_id and t.workspace_id = new.workspace_id
  ) then
    raise exception 'Komentar harus terkait tugas dari workspace yang sama.';
  end if;
  return new;
end;
$$;

-- Triggers
 drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
drop trigger if exists workspaces_updated_at on public.workspaces;
create trigger workspaces_updated_at before update on public.workspaces
  for each row execute procedure public.set_updated_at();
drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects
  for each row execute procedure public.set_updated_at();
drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks
  for each row execute procedure public.set_updated_at();
drop trigger if exists comments_updated_at on public.task_comments;
create trigger comments_updated_at before update on public.task_comments
  for each row execute procedure public.set_updated_at();
drop trigger if exists tasks_project_workspace_guard on public.tasks;
create trigger tasks_project_workspace_guard before insert or update of project_id, workspace_id on public.tasks
  for each row execute procedure public.validate_task_project_workspace();
drop trigger if exists tasks_completion_timestamp on public.tasks;
create trigger tasks_completion_timestamp before update of status on public.tasks
  for each row execute procedure public.log_task_completion();
drop trigger if exists comments_task_workspace_guard on public.task_comments;
create trigger comments_task_workspace_guard before insert or update of task_id, workspace_id on public.task_comments
  for each row execute procedure public.validate_comment_task_workspace();

-- Row Level Security: enable it on every user-facing table.
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.activity_logs enable row level security;
alter table public.notifications enable row level security;

-- Profiles: users can view themselves and colleagues within shared workspaces.
drop policy if exists "profiles_select_shared_workspace" on public.profiles;
create policy "profiles_select_shared_workspace" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.can_view_profile(id));
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Workspaces
drop policy if exists "workspace_members_can_read" on public.workspaces;
create policy "workspace_members_can_read" on public.workspaces
  for select to authenticated using (public.is_workspace_member(id));
drop policy if exists "workspace_admins_can_update" on public.workspaces;
create policy "workspace_admins_can_update" on public.workspaces
  for update to authenticated using (public.has_workspace_role(id, array['owner','admin']))
  with check (public.has_workspace_role(id, array['owner','admin']));

-- Memberships: visible to members, but membership writes are intentionally not exposed to clients.
drop policy if exists "members_can_read_workspace_members" on public.workspace_members;
create policy "members_can_read_workspace_members" on public.workspace_members
  for select to authenticated using (public.is_workspace_member(workspace_id));

-- Projects
drop policy if exists "workspace_members_can_read_projects" on public.projects;
create policy "workspace_members_can_read_projects" on public.projects
  for select to authenticated using (public.is_workspace_member(workspace_id));
drop policy if exists "workspace_members_can_create_projects" on public.projects;
create policy "workspace_members_can_create_projects" on public.projects
  for insert to authenticated with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
drop policy if exists "workspace_members_can_update_projects" on public.projects;
create policy "workspace_members_can_update_projects" on public.projects
  for update to authenticated using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
drop policy if exists "workspace_admins_can_delete_projects" on public.projects;
create policy "workspace_admins_can_delete_projects" on public.projects
  for delete to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin']));

-- Tasks
drop policy if exists "workspace_members_can_read_tasks" on public.tasks;
create policy "workspace_members_can_read_tasks" on public.tasks
  for select to authenticated using (public.is_workspace_member(workspace_id));
drop policy if exists "workspace_members_can_create_tasks" on public.tasks;
create policy "workspace_members_can_create_tasks" on public.tasks
  for insert to authenticated with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
drop policy if exists "workspace_members_can_update_tasks" on public.tasks;
create policy "workspace_members_can_update_tasks" on public.tasks
  for update to authenticated using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
drop policy if exists "workspace_members_can_delete_tasks" on public.tasks;
create policy "workspace_members_can_delete_tasks" on public.tasks
  for delete to authenticated using (public.is_workspace_member(workspace_id));

-- Comments
drop policy if exists "workspace_members_can_read_comments" on public.task_comments;
create policy "workspace_members_can_read_comments" on public.task_comments
  for select to authenticated using (public.is_workspace_member(workspace_id));
drop policy if exists "workspace_members_can_create_comments" on public.task_comments;
create policy "workspace_members_can_create_comments" on public.task_comments
  for insert to authenticated with check (public.is_workspace_member(workspace_id) and user_id = auth.uid());
drop policy if exists "authors_can_update_comments" on public.task_comments;
create policy "authors_can_update_comments" on public.task_comments
  for update to authenticated using (user_id = auth.uid() and public.is_workspace_member(workspace_id))
  with check (user_id = auth.uid() and public.is_workspace_member(workspace_id));
drop policy if exists "authors_can_delete_comments" on public.task_comments;
create policy "authors_can_delete_comments" on public.task_comments
  for delete to authenticated using (user_id = auth.uid() and public.is_workspace_member(workspace_id));

-- Activity logs: members may read and create their own activity entries.
drop policy if exists "workspace_members_can_read_activity" on public.activity_logs;
create policy "workspace_members_can_read_activity" on public.activity_logs
  for select to authenticated using (public.is_workspace_member(workspace_id));
drop policy if exists "workspace_members_can_create_activity" on public.activity_logs;
create policy "workspace_members_can_create_activity" on public.activity_logs
  for insert to authenticated with check (public.is_workspace_member(workspace_id) and actor_id = auth.uid());

-- Notifications are private to the recipient.
drop policy if exists "users_can_read_own_notifications" on public.notifications;
create policy "users_can_read_own_notifications" on public.notifications
  for select to authenticated using (user_id = auth.uid() and public.is_workspace_member(workspace_id));
drop policy if exists "users_can_update_own_notifications" on public.notifications;
create policy "users_can_update_own_notifications" on public.notifications
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_workspace_member(workspace_id));

-- Important: do not put the Supabase service_role key in browser code or NEXT_PUBLIC_* variables.
