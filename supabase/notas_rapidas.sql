-- supabase/notas_rapidas.sql
-- Notas rápidas del Inicio del panel (tipo post-it, no ligadas a ningún proyecto).
-- Ejecutar UNA vez en Supabase → SQL Editor.

create table if not exists public.notas_rapidas (
  id          bigint generated always as identity primary key,
  texto       text not null,
  hecha       boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.notas_rapidas enable row level security;

create policy "auth all" on public.notas_rapidas
  for all to authenticated
  using (true) with check (true);
