-- supabase/ajustes.sql
-- Ajustes del panel en formato clave → valor.
-- De momento: el token secreto del calendario suscrito del iPhone
-- (lo lee netlify/functions/calendario.mjs y se puede regenerar desde el panel).
-- Ejecutar UNA vez en Supabase → SQL Editor.

create table if not exists public.ajustes (
  clave       text primary key,
  valor       text not null,
  updated_at  timestamptz not null default now()
);

alter table public.ajustes enable row level security;

create policy "auth all" on public.ajustes
  for all to authenticated
  using (true) with check (true);

-- Token inicial: 64 caracteres aleatorios
insert into public.ajustes (clave, valor)
values ('calendario_token', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (clave) do nothing;
