-- Project-scoped access hardening for existing TaskFlow installations.
-- Run AFTER 20261105_project_scoped_collaboration.sql.
-- Does not delete projects, tasks, members, or historical activity.

begin;

-- Project membership can only be granted through the email-bound acceptance RPC.
drop policy if exists "project_managers_can_add_members" on public.project_members;
revoke insert on public.project_members from anon, authenticated;
grant select, delete on public.project_members to authenticated;

-- Workspace membership rosters are not a collaboration surface anymore.
-- A collaborator's access comes only from public.project_members.
drop policy if exists "workspace_owner_can_read_workspace_members" on public.workspace_members;
create policy "workspace_owner_can_read_workspace_members" on public.workspace_members
  for select to authenticated using (user_id = auth.uid());

-- Remove any lingering legacy workspace-wide invitation route/policies.
drop function if exists public.accept_workspace_invitation(text);
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

-- Only users who share an explicit project can discover one another's profile.
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

commit;
