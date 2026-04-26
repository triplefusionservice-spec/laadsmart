-- Fout: invalid input syntax for type real: "2026-04-26"
-- Oorzaak: kolom `datum` heeft per ongeluk type real/double i.p.v. date.
-- Voer uit in Supabase → SQL Editor.
-- Let op: oude waarden in kolom `datum` gaan verloren (meestal ok bij test).

alter table public.sessies drop column if exists datum;
alter table public.sessies add column datum date not null default (current_date);
