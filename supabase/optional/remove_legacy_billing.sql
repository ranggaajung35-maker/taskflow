-- OPTIONAL CLEANUP ONLY.
-- Run this only if you no longer need any historical billing/payment records.
-- Back up your Supabase project before running this script.
-- The current TaskFlow app does not use these tables, so running this is NOT required.

begin;

drop table if exists public.billing_payments cascade;
drop table if exists public.billing_webhook_events cascade;
drop table if exists public.billing_subscriptions cascade;
drop function if exists public.billing_set_updated_at() cascade;

commit;
