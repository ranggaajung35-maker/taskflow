# Security policy

## Reporting a vulnerability

Do not publish credentials, access tokens, customer data, or an exploitable report in a public issue. For a deployed instance, contact the service owner through a private channel and include a reproducible description and impact assessment.

## Deployment checklist

- Keep `.env.local` out of Git.
- Use only the Supabase anon/publishable key in the browser.
- Never expose the Supabase `service_role` or Secret key in frontend code or `NEXT_PUBLIC_*` variables.
- Confirm RLS is enabled for all customer-owned tables.
- Review each RLS policy using at least two separate test accounts and separate workspaces.
- Enable email confirmation and configure allowed redirect URLs.
- Set production `NEXT_PUBLIC_APP_URL` to the canonical HTTPS domain.
- Configure database backups and error monitoring.
- Review server-action authorization before adding new mutations.

## Payments

TaskFlow is a free application and does not integrate a payment gateway. It has no billing checkout, payment webhook, subscription entitlements, or payment-related server secrets. Do not add payment credentials to the deployment environment unless a future, separately reviewed feature requires them.
