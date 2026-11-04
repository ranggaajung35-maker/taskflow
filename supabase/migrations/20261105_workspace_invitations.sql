-- TaskFlow workspace invitations (shareable links; no email SMTP required).
-- Run once in Supabase Dashboard > SQL Editor after supabase/schema.sql.

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invited_email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_workspace_invitations_workspace
  on public.workspace_invitations(workspace_id, created_at desc);
create index if not exists idx_workspace_invitations_email
  on public.workspace_invitations(lower(invited_email));

alter table public.workspace_invitations enable row level security;

drop policy if exists "workspace_admins_can_read_invitations" on public.workspace_invitations;
create policy "workspace_admins_can_read_invitations"
  on public.workspace_invitations for select to authenticated
  using (public.has_workspace_role(workspace_id, array['owner','admin']));

drop policy if exists "workspace_admins_can_create_invitations" on public.workspace_invitations;
create policy "workspace_admins_can_create_invitations"
  on public.workspace_invitations for insert to authenticated
  with check (
    public.has_workspace_role(workspace_id, array['owner','admin'])
    and (role = 'member' or public.has_workspace_role(workspace_id, array['owner']))
    and invited_by = auth.uid()
  );

drop policy if exists "workspace_admins_can_revoke_invitations" on public.workspace_invitations;
grant select, insert, delete on public.workspace_invitations to authenticated;

create policy "workspace_admins_can_revoke_invitations"
  on public.workspace_invitations for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['owner','admin']));

create or replace function public.accept_workspace_invitation(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.workspace_invitations%rowtype;
  current_email text;
begin
  if auth.uid() is null then
    raise exception 'Silakan masuk terlebih dahulu.';
  end if;

  current_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  select * into invitation
  from public.workspace_invitations wi
  where wi.token_hash = p_token_hash
    and lower(wi.invited_email) = current_email
    and wi.accepted_at is null
    and wi.expires_at > now()
  for update;

  if not found then
    raise exception 'Undangan tidak valid, sudah digunakan, kedaluwarsa, atau email akun tidak cocok.';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (invitation.workspace_id, auth.uid(), invitation.role)
  on conflict (workspace_id, user_id) do nothing;

  update public.workspace_invitations
  set accepted_at = now()
  where id = invitation.id;

  return invitation.workspace_id;
end;
$$;

revoke all on function public.accept_workspace_invitation(text) from public;
revoke all on function public.accept_workspace_invitation(text) from anon;
grant execute on function public.accept_workspace_invitation(text) to authenticated;
