-- supabase/visitas.sql
-- Analítica propia de extreweb.es: una fila por página vista.
-- Ejecutar UNA vez en Supabase → SQL Editor.
--
-- No se guarda ninguna IP ni nada que identifique a una persona: `visitante` es
-- una huella que cambia cada día (ver netlify/functions/visita.mjs), así que
-- sirve para contar visitantes del día y no para seguir a nadie.

create table if not exists public.visitas (
  id         bigint generated always as identity primary key,
  creado     timestamptz not null default now(),
  ruta       text not null,                    -- '/servicios/seo/'
  referente  text,                             -- dominio de origen; null = entró directo
  pais       text,                             -- 'ES'
  ciudad     text,
  movil      boolean not null default false,
  visitante  text not null                     -- huella anónima del día
);

create index if not exists visitas_creado_idx on public.visitas (creado desc);

alter table public.visitas enable row level security;

-- Misma política que el resto de tablas del panel: solo con sesión iniciada.
-- La función de Netlify escribe con la clave service_role, que se salta la RLS.
create policy "auth all" on public.visitas
  for all to authenticated
  using (true) with check (true);

-- Limpieza: conviene no guardar el histórico para siempre.
-- Ejecuta esto de vez en cuando (o prográmalo en Supabase → Cron):
--   delete from public.visitas where creado < now() - interval '12 months';
