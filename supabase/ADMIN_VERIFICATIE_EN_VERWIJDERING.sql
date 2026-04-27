-- =============================================================================
-- LaadSmart — Administrator: controleren of data weg is + handmatig verwijderen
-- Voer uit in Supabase → SQL Editor (postgres / service context).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Controle: nog laadsessies voor een gebruiker? (moet 0 na geslaagde verwijdering)
-- -----------------------------------------------------------------------------
-- Vervang de UUID door het user_id uit Dashboard → Authentication → Users.

-- select count(*) as aantal_sessies
-- from public.sessies
-- where user_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- Overzicht per user_id:
-- select user_id, count(*) as aantal
-- from public.sessies
-- group by user_id
-- order by aantal desc;

-- Sessies waarvan de gebruiker niet meer in auth.users staat (controle op “wezen”):
-- select s.id, s.user_id, s.created_at
-- from public.sessies s
-- where s.user_id is not null
--   and not exists (select 1 from auth.users u where u.id = s.user_id);

-- -----------------------------------------------------------------------------
-- 2) Admin: alle laadsessies van één gebruiker handmatig wissen
-- -----------------------------------------------------------------------------
-- delete from public.sessies
-- where user_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- -----------------------------------------------------------------------------
-- 3) Auth-account verwijderen als admin
-- -----------------------------------------------------------------------------
-- Dashboard → Authentication → Users → gebruiker → Delete.
-- Of server-side: supabase.auth.admin.deleteUser('uuid') met service role (nooit in de browser).

-- -----------------------------------------------------------------------------
-- 4) “Na 30 dagen echt weg?”
-- -----------------------------------------------------------------------------
-- A) Tabel sessies: queries hierboven opnieuw; count moet 0 zijn.
-- B) Supabase backups / logs: zie projectdocumentatie en verwerkersovereenkomst.
-- C) Optioneel geplande opschoning wees-data (pg_cron / Edge Function), bijv. na 30 dagen:
-- delete from public.sessies s
-- where s.user_id is not null
--   and not exists (select 1 from auth.users u where u.id = s.user_id)
--   and s.created_at < now() - interval '30 days';
