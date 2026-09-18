-- supabase/mensajes.sql
-- Mensajes del formulario de contacto (los inserta netlify/functions/submission-created.mjs).
-- Ejecutar UNA vez en Supabase → SQL Editor.

create table if not exists public.mensajes (
  id          bigint generated always as identity primary key,
  netlify_id  text unique,
  nombre      text not null,
  email       text not null,
  servicio    text,
  mensaje     text not null,
  leido       boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists mensajes_created_at_idx on public.mensajes (created_at desc);

-- Misma regla que el resto de tablas: solo la sesión del panel ve y toca.
-- anon no tiene política → no puede leer ni escribir.
-- La función de Netlify usa la service key, que se salta la RLS.
alter table public.mensajes enable row level security;

create policy "auth all" on public.mensajes
  for all to authenticated
  using (true) with check (true);
