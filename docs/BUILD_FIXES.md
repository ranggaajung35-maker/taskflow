# Build fixes

This update resolves the issues reported by `npm run typecheck` and `npm run lint`.

- The old `InviteMemberDialog` belonged to workspace-wide invitations and referenced a removed server action. It was removed because the current collaboration model is project-scoped and uses `InviteProjectDialog`.
- `FocusTimer` now updates completion state in the interval callback, avoiding the `react-hooks/set-state-in-effect` lint error.
- Removed unused imports from the logo and member action components.
- Kept the required `FormData` server-action parameter and marked it as intentionally consumed.

After applying this update, run:

```powershell
npm run typecheck
npm run lint
npm run build
```

A full dependency-backed build has not been run in the packaging environment because the npm registry connection timed out.
