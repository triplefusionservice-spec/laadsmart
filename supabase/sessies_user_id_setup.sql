-- LaadSmart: koppel elke laadsessie aan het ingelogde account (éénmalig uitvoeren in Supabase SQL Editor).
-- Daarna kan de app bij accountverwijdering alle sessies van die gebruiker wissen.

alter table public.sessies
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

comment on column public.sessies.user_id is 'Eigenaar van de laadsessie; vult de app bij insert, of gebruik DEFAULT auth.uid()';

-- Optioneel: nieuwe rijen automatisch aan huidige gebruiker koppelen (dan hoeft de client geen user_id te sturen).
-- alter table public.sessies alter column user_id set default auth.uid();

-- Bestaande rijen zonder user_id blijven staan tot je ze handmatig mapt of verwijdert (let op bij meerdere gebruikers).
