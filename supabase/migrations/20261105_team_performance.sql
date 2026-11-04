-- Team performance and safe task assignment.
-- Run once in Supabase SQL Editor after supabase/schema.sql.
-- Existing tasks and workspace data are preserved.

create index if not exists idx_tasks_workspace_assignee_status
  on public.tasks (workspace_id, assignee_id, status);

create index if not exists idx_tasks_workspace_completed_at
  on public.tasks (workspace_id, completed_at)
  where completed_at is not null;

create or replace function public.validate_task_assignee_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assignee_id is not null and not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = new.workspace_id
      and wm.user_id = new.assignee_id
  ) then
    raise exception 'Penanggung jawab harus merupakan anggota workspace yang sama.';
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_assignee_workspace_guard on public.tasks;
create trigger tasks_assignee_workspace_guard
  before insert or update of assignee_id, workspace_id on public.tasks
  for each row execute procedure public.validate_task_assignee_workspace();

-- The existing workspace-member RLS policies already allow members to read tasks
-- within their workspace. This migration adds no broader data access policy.
