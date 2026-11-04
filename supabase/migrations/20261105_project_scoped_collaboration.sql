-- Project-scoped collaboration for TaskFlow.
-- Run once in Supabase SQL Editor AFTER schema.sql and the earlier migrations.
-- Existing projects/tasks are preserved. Legacy workspace invitations stop granting project access.

begin;

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('manager', 'member')),
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.project_invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  invited_email text not null,
  role text not null default 'member' check (role in ('manager', 'member')),
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.activity_logs
  add column if not exists project_id uuid references public.projects(id) on delete cascade;

create index if not exists idx_project_members_user on public.project_members(user_id);
create index if not exists idx_project_members_project on public.project_members(project_id);
create index if not exists idx_project_invitations_project on public.project_invitations(project_id, created_at desc);
create index if not exists idx_project_invitations_email on public.project_invitations(lower(invited_email));
create index if not exists idx_tasks_project_status on public.tasks(project_id, status);
create index if not exists idx_tasks_project_assignee on public.tasks(project_id, assignee_id, status);
create index if not exists idx_activity_project_created on public.activity_logs(project_id, created_at desc);

create or replace function public.is_workspace_owner(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspaces w
    where w.id = target_workspace and w.created_by = auth.uid()
  ) or exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace
      and wm.user_id = auth.uid()
      and wm.role = 'owner'
  );
$$;

create or replace function public.is_project_member(target_project uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project
      and (
        p.created_by = auth.uid()
        or public.is_workspace_owner(p.workspace_id)
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.has_project_role(target_project uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = target_project
      and (
        (p.created_by = auth.uid() and 'owner' = any(allowed_roles))
        or (public.is_workspace_owner(p.workspace_id) and 'owner' = any(allowed_roles))
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id
            and pm.user_id = auth.uid()
            and pm.role = any(allowed_roles)
        )
      )
  );
$$;

revoke all on function public.is_workspace_owner(uuid) from public, anon;
grant execute on function public.is_workspace_owner(uuid) to authenticated;
revoke all on function public.is_project_member(uuid) from public, anon;
grant execute on function public.is_project_member(uuid) to authenticated;
revoke all on function public.has_project_role(uuid, text[]) from public, anon;
grant execute on function public.has_project_role(uuid, text[]) to authenticated;

create or replace function public.can_view_profile(target_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_profile = auth.uid()
    or exists (
      select 1
      from public.project_members mine
      join public.project_members theirs on theirs.project_id = mine.project_id
      where mine.user_id = auth.uid() and theirs.user_id = target_profile
    )
    or exists (
      select 1
      from public.projects p
      join public.project_members pm on pm.project_id = p.id
      where (p.created_by = auth.uid() and pm.user_id = target_profile)
         or (p.created_by = target_profile and pm.user_id = auth.uid())
         or (public.is_workspace_owner(p.workspace_id) and pm.user_id = target_profile)
    );
$$;

revoke all on function public.can_view_profile(uuid) from public, anon;
grant execute on function public.can_view_profile(uuid) to authenticated;

create or replace function public.prevent_project_tenant_move()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.workspace_id is distinct from old.workspace_id or new.created_by is distinct from old.created_by then
    raise exception 'Pemilik dan workspace proyek tidak dapat dipindahkan setelah proyek dibuat.';
  end if;
  return new;
end;
$$;

drop trigger if exists projects_prevent_tenant_move on public.projects;
create trigger projects_prevent_tenant_move
  before update of workspace_id, created_by on public.projects
  for each row execute procedure public.prevent_project_tenant_move();

create or replace function public.validate_activity_project_scope()
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
    raise exception 'Aktivitas harus terkait dengan proyek di workspace yang sama.';
  end if;
  return new;
end;
$$;

drop trigger if exists activity_project_scope_guard on public.activity_logs;
create trigger activity_project_scope_guard
  before insert or update of project_id, workspace_id on public.activity_logs
  for each row execute procedure public.validate_activity_project_scope();

create or replace function public.validate_task_project_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  project_workspace uuid;
begin
  if new.project_id is not null then
    select p.workspace_id into project_workspace
    from public.projects p where p.id = new.project_id;
    if project_workspace is null or project_workspace <> new.workspace_id then
      raise exception 'Proyek dan tugas harus berasal dari workspace yang sama.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.validate_task_assignee_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assignee_id is not null then
    if new.project_id is null then
      raise exception 'Pilih proyek sebelum menetapkan penanggung jawab.';
    end if;
    if not exists (
      select 1 from public.projects p
      where p.id = new.project_id and p.created_by = new.assignee_id
    ) and not exists (
      select 1 from public.project_members pm
      where pm.project_id = new.project_id and pm.user_id = new.assignee_id
    ) then
      raise exception 'Penanggung jawab harus menjadi anggota proyek ini.';
    end if;
  end if;
  return new;
end;
$$;

-- Backfill project scope for historical task/project activity records.
update public.activity_logs a
set project_id = case
  when a.entity_type = 'task' then (select t.project_id from public.tasks t where t.id = a.entity_id)
  when a.entity_type = 'project' then (select p.id from public.projects p where p.id = a.entity_id)
  else a.project_id
end
where a.project_id is null and a.entity_id is not null;

-- Remove the prior workspace-wide invite acceptance path. New invites are per project.
drop function if exists public.accept_workspace_invitation(text);
-- Disable legacy workspace-wide invite records if that older migration was installed.
do $$
begin
  if to_regclass('public.workspace_invitations') is not null then
    execute 'drop policy if exists "workspace_admins_can_read_invitations" on public.workspace_invitations';
    execute 'drop policy if exists "workspace_admins_can_create_invitations" on public.workspace_invitations';
    execute 'drop policy if exists "workspace_admins_can_revoke_invitations" on public.workspace_invitations';
    execute 'revoke all on public.workspace_invitations from anon, authenticated';
  end if;
end;
$$;

alter table public.project_members enable row level security;
alter table public.project_invitations enable row level security;

-- Profile directory: only people who share at least one accessible project can see one another.
drop policy if exists "profiles_select_shared_workspace" on public.profiles;
create policy "profiles_select_shared_project" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.can_view_profile(id));

-- Workspace metadata and member rosters are private to the workspace owner.
drop policy if exists "workspace_members_can_read" on public.workspaces;
drop policy if exists "workspace_members_can_read_members" on public.workspaces;
drop policy if exists "workspace_members_can_read_workspace" on public.workspaces;
drop policy if exists "workspace_members_can_read" on public.workspace_members;
drop policy if exists "members_can_read_workspace_members" on public.workspace_members;
drop policy if exists "workspace_owner_can_read_workspace" on public.workspaces;
create policy "workspace_owner_can_read_workspace" on public.workspaces
  for select to authenticated using (public.is_workspace_owner(id));
drop policy if exists "workspace_owner_can_read_workspace_members" on public.workspace_members;
create policy "workspace_owner_can_read_workspace_members" on public.workspace_members
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "workspace_admins_can_update" on public.workspaces;
drop policy if exists "workspace_owner_can_update" on public.workspaces;
create policy "workspace_owner_can_update" on public.workspaces
  for update to authenticated using (public.is_workspace_owner(id))
  with check (public.is_workspace_owner(id));

-- Projects: owner sees all projects in their own workspace; collaborators see only explicitly shared projects.
drop policy if exists "workspace_members_can_read_projects" on public.projects;
drop policy if exists "workspace_members_can_create_projects" on public.projects;
drop policy if exists "workspace_members_can_update_projects" on public.projects;
drop policy if exists "workspace_admins_can_delete_projects" on public.projects;
drop policy if exists "project_members_can_read_project" on public.projects;
create policy "project_members_can_read_project" on public.projects
  for select to authenticated using (public.is_project_member(id));
drop policy if exists "workspace_owner_can_create_project" on public.projects;
create policy "workspace_owner_can_create_project" on public.projects
  for insert to authenticated with check (public.is_workspace_owner(workspace_id) and created_by = auth.uid());
drop policy if exists "project_managers_can_update_project" on public.projects;
create policy "project_managers_can_update_project" on public.projects
  for update to authenticated using (public.has_project_role(id, array['owner','manager']))
  with check (public.has_project_role(id, array['owner','manager']));
drop policy if exists "project_owner_can_delete_project" on public.projects;
create policy "project_owner_can_delete_project" on public.projects
  for delete to authenticated using (public.has_project_role(id, array['owner']));

-- Project membership directory.
drop policy if exists "project_members_can_read" on public.project_members;
drop policy if exists "project_managers_can_add_members" on public.project_members;
drop policy if exists "project_managers_or_self_can_remove_members" on public.project_members;
create policy "project_members_can_read" on public.project_members
  for select to authenticated using (public.is_project_member(project_id));
-- Membership is granted only through accept_project_invitation(), which verifies the invited email.
create policy "project_managers_or_self_can_remove_members" on public.project_members
  for delete to authenticated using (
    user_id = auth.uid()
    or (public.has_project_role(project_id, array['owner','manager'])
      and not exists (select 1 from public.projects p where p.id = project_id and p.created_by = user_id))
  );
revoke insert on public.project_members from anon, authenticated;
grant select, delete on public.project_members to authenticated;

-- Invitations are visible/manageable only by project owner/manager.
drop policy if exists "project_managers_can_read_invites" on public.project_invitations;
drop policy if exists "project_managers_can_create_invites" on public.project_invitations;
drop policy if exists "project_managers_can_delete_invites" on public.project_invitations;
create policy "project_managers_can_read_invites" on public.project_invitations
  for select to authenticated using (public.has_project_role(project_id, array['owner','manager']));
create policy "project_managers_can_create_invites" on public.project_invitations
  for insert to authenticated with check (
    public.has_project_role(project_id, array['owner','manager'])
    and invited_by = auth.uid()
  );
create policy "project_managers_can_delete_invites" on public.project_invitations
  for delete to authenticated using (public.has_project_role(project_id, array['owner','manager']));
grant select, insert, delete on public.project_invitations to authenticated;

-- A link can only be accepted by a signed-in account whose email exactly matches the invite.
create or replace function public.accept_project_invitation(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.project_invitations%rowtype;
  current_email text;
begin
  if auth.uid() is null then
    raise exception 'Silakan masuk terlebih dahulu.';
  end if;
  current_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  select * into invitation
  from public.project_invitations pi
  where pi.token_hash = p_token_hash
    and lower(pi.invited_email) = current_email
    and pi.accepted_at is null
    and pi.expires_at > now()
  for update;
  if not found then
    raise exception 'Undangan proyek tidak valid, sudah digunakan, kedaluwarsa, atau email akun tidak cocok.';
  end if;
  insert into public.project_members (project_id, user_id, role, invited_by)
  values (invitation.project_id, auth.uid(), invitation.role, invitation.invited_by)
  on conflict (project_id, user_id) do nothing;
  update public.project_invitations set accepted_at = now() where id = invitation.id;
  return invitation.project_id;
end;
$$;
revoke all on function public.accept_project_invitation(text) from public;
revoke all on function public.accept_project_invitation(text) from anon;
grant execute on function public.accept_project_invitation(text) to authenticated;

-- Tasks: members can see and work only on tasks in projects they belong to.
drop policy if exists "workspace_members_can_read_tasks" on public.tasks;
drop policy if exists "workspace_members_can_create_tasks" on public.tasks;
drop policy if exists "workspace_members_can_update_tasks" on public.tasks;
drop policy if exists "workspace_members_can_delete_tasks" on public.tasks;
drop policy if exists "project_members_can_read_tasks" on public.tasks;
create policy "project_members_can_read_tasks" on public.tasks
  for select to authenticated using (
    (project_id is not null and public.is_project_member(project_id))
    or (project_id is null and public.is_workspace_owner(workspace_id))
  );
drop policy if exists "project_members_can_create_tasks" on public.tasks;
create policy "project_members_can_create_tasks" on public.tasks
  for insert to authenticated with check (
    created_by = auth.uid()
    and project_id is not null
    and public.is_project_member(project_id)
    and exists (select 1 from public.projects p where p.id = public.tasks.project_id and p.workspace_id = public.tasks.workspace_id)
  );
drop policy if exists "project_members_can_update_tasks" on public.tasks;
create policy "project_members_can_update_tasks" on public.tasks
  for update to authenticated using (
    (project_id is not null and public.is_project_member(project_id))
    or (project_id is null and public.is_workspace_owner(workspace_id))
  ) with check (
    (project_id is not null and public.is_project_member(project_id)
      and exists (select 1 from public.projects p where p.id = public.tasks.project_id and p.workspace_id = public.tasks.workspace_id))
    or (project_id is null and public.is_workspace_owner(workspace_id))
  );
drop policy if exists "project_members_can_delete_tasks" on public.tasks;
create policy "project_members_can_delete_tasks" on public.tasks
  for delete to authenticated using (
    (project_id is not null and public.is_project_member(project_id))
    or (project_id is null and public.is_workspace_owner(workspace_id))
  );

-- Task comments inherit the visibility of their parent task.
drop policy if exists "workspace_members_can_read_comments" on public.task_comments;
drop policy if exists "workspace_members_can_create_comments" on public.task_comments;
drop policy if exists "authors_can_update_comments" on public.task_comments;
drop policy if exists "authors_can_delete_comments" on public.task_comments;
drop policy if exists "project_members_can_read_task_comments" on public.task_comments;
create policy "project_members_can_read_task_comments" on public.task_comments
  for select to authenticated using (
    exists (select 1 from public.tasks t where t.id = public.task_comments.task_id and t.project_id is not null and public.is_project_member(t.project_id))
    or exists (select 1 from public.tasks t where t.id = public.task_comments.task_id and t.project_id is null and public.is_workspace_owner(t.workspace_id))
  );
drop policy if exists "project_members_can_create_task_comments" on public.task_comments;
create policy "project_members_can_create_task_comments" on public.task_comments
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.tasks t where t.id = public.task_comments.task_id and t.workspace_id = public.task_comments.workspace_id
      and t.project_id is not null and public.is_project_member(t.project_id))
  );
drop policy if exists "authors_can_update_project_comments" on public.task_comments;
create policy "authors_can_update_project_comments" on public.task_comments
  for update to authenticated using (
    user_id = auth.uid() and exists (
      select 1 from public.tasks t where t.id = public.task_comments.task_id
        and t.project_id is not null and public.is_project_member(t.project_id)
    )
  ) with check (
    user_id = auth.uid() and exists (
      select 1 from public.tasks t where t.id = public.task_comments.task_id and t.workspace_id = public.task_comments.workspace_id
        and t.project_id is not null and public.is_project_member(t.project_id)
    )
  );
drop policy if exists "authors_can_delete_project_comments" on public.task_comments;
create policy "authors_can_delete_project_comments" on public.task_comments
  for delete to authenticated using (
    user_id = auth.uid() and exists (
      select 1 from public.tasks t where t.id = public.task_comments.task_id
        and t.project_id is not null and public.is_project_member(t.project_id)
    )
  );

-- Activity history is scoped to its project. Workspace-level events remain owner-only.
drop policy if exists "workspace_members_can_read_activity" on public.activity_logs;
drop policy if exists "workspace_members_can_create_activity" on public.activity_logs;
drop policy if exists "project_members_can_read_activity" on public.activity_logs;
create policy "project_members_can_read_activity" on public.activity_logs
  for select to authenticated using (
    (project_id is not null and public.is_project_member(project_id))
    or (project_id is null and public.is_workspace_owner(workspace_id))
  );
drop policy if exists "project_members_can_create_activity" on public.activity_logs;
create policy "project_members_can_create_activity" on public.activity_logs
  for insert to authenticated with check (
    actor_id = auth.uid()
    and (
      (project_id is not null and public.is_project_member(project_id))
      or (project_id is null and public.is_workspace_owner(workspace_id))
    )
  );

-- Enforce the project for assignees at database level (not only in the UI).
drop trigger if exists tasks_assignee_workspace_guard on public.tasks;
drop trigger if exists tasks_assignee_project_guard on public.tasks;
create trigger tasks_assignee_project_guard
  before insert or update of assignee_id, project_id on public.tasks
  for each row execute procedure public.validate_task_assignee_project();

commit;
