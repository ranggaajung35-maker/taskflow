# Architecture notes

## Request and data flow

1. A visitor opens the marketing site or an authenticated workspace route.
2. Workspace layout resolves the current Supabase user on the server.
3. Server-side query functions read only the selected user's workspace data. Supabase Row Level Security remains the final authorization layer.
4. Client components own short-lived interaction state such as filters, dialogs, optimistic status changes, and demo-only temporary records.
5. Server actions validate mutations with Zod, resolve the signed-in user/workspace, then write through the server-side Supabase client.
6. Successful mutations revalidate affected routes so server-rendered summaries stay aligned with persisted records.

## Main domains

- Identity: `profiles`
- Workspace and membership: `workspaces`, `workspace_members`
- Project planning: `projects`, `tasks`
- Collaboration: `task_comments`, `activity_logs`
- User communication: `notifications`

## Design decisions

- Next.js App Router provides route-level composition and server-rendered data access.
- Supabase Auth uses cookie-backed SSR sessions via `@supabase/ssr`.
- RLS isolates rows by workspace membership; the service-role key is never included in client configuration.
- Mutating operations are expressed as server actions instead of exposing database credentials to the browser.
- Demo fixtures allow UI exploration without a Supabase project. They are not a substitute for a persistent backend.

## Current boundaries

The current MVP does not include invitations, role editing, file uploads, push/email delivery, recurring tasks, payment webhooks, or subscription entitlements. These should be implemented as isolated modules with their own authorization checks and tests before a commercial launch.
