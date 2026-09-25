-- supabase/panel-ampliacion.sql
-- Ampliación del panel (24/09/2026): analítica ampliada, pendientes, renovaciones,
-- ficha técnica, checklist, horas, archivos, plantillas y presupuesto en PDF.
--
-- Ejecutar UNA vez en Supabase → SQL Editor, DESPUÉS de visitas.sql.
-- Se puede volver a ejecutar sin romper nada (todo lleva "if not exists").
--
-- Todas las tablas nuevas siguen la misma RLS que el resto: solo con sesión
-- iniciada. Las funciones de Netlify escriben con la service key (se la salta).

-- =====================================================================
-- 1. ANALÍTICA AMPLIADA
-- =====================================================================

-- Qué web es (la nuestra o la de un cliente), de qué campaña viene y si era un 404
alter table public.visitas add column if not exists sitio   text not null default 'extreweb.es';
alter table public.visitas add column if not exists campana text;   -- utm_campaign
alter table public.visitas add column if not exists fuente  text;   -- utm_source
alter table public.visitas add column if not exists es_404  boolean not null default false;
create index if not exists visitas_sitio_creado_idx on public.visitas (sitio, creado desc);

-- Velocidad real: cuánto tarda la web en el dispositivo de cada visitante
create table if not exists public.velocidad (
  id      bigint generated always as identity primary key,
  creado  timestamptz not null default now(),
  sitio   text not null default 'extreweb.es',
  ruta    text not null,
  movil   boolean not null default false,
  lcp     integer,   -- ms hasta que se pinta lo principal (lo que mira Google)
  carga   integer,   -- ms hasta que termina de cargar la página
  ttfb    integer    -- ms hasta la primera respuesta del servidor
);
create index if not exists velocidad_sitio_creado_idx on public.velocidad (sitio, creado desc);
alter table public.velocidad enable row level security;
drop policy if exists "auth all" on public.velocidad;
create policy "auth all" on public.velocidad for all to authenticated using (true) with check (true);

-- Enlaces de campaña (Instagram, WhatsApp…) creados desde el panel
create table if not exists public.enlaces (
  id          bigint generated always as identity primary key,
  nombre      text not null,          -- 'Reel web GuadiCar'
  url         text not null,          -- el enlace completo, con utm_*
  campana     text not null,
  fuente      text not null,
  created_at  timestamptz not null default now()
);
alter table public.enlaces enable row level security;
drop policy if exists "auth all" on public.enlaces;
create policy "auth all" on public.enlaces for all to authenticated using (true) with check (true);

-- =====================================================================
-- 2. MENSAJES Y PLANTILLAS
-- =====================================================================

alter table public.mensajes add column if not exists pagina        text;         -- página desde la que fue a contacto
alter table public.mensajes add column if not exists origen        text;         -- web externa o campaña de origen
alter table public.mensajes add column if not exists respondido_at timestamptz;

create table if not exists public.plantillas (
  id          bigint generated always as identity primary key,
  titulo      text not null,
  asunto      text,
  cuerpo      text not null,          -- admite {nombre}
  created_at  timestamptz not null default now()
);
alter table public.plantillas enable row level security;
drop policy if exists "auth all" on public.plantillas;
create policy "auth all" on public.plantillas for all to authenticated using (true) with check (true);

-- Tres plantillas de partida (solo si la tabla está vacía)
insert into public.plantillas (titulo, asunto, cuerpo)
select * from (values
  ('Primera respuesta', 'Tu consulta en extreweb',
   E'Hola, {nombre}:\n\nGracias por escribirnos. Para darte un presupuesto ajustado, ¿nos cuentas un poco más sobre tu negocio y qué te gustaría conseguir con la web?\n\nSi te viene mejor, lo hablamos por teléfono o en persona.\n\nUn saludo,\nextreweb'),
  ('Envío de presupuesto', 'Presupuesto de tu web',
   E'Hola, {nombre}:\n\nTe adjuntamos el presupuesto que hablamos. Cualquier duda o cambio, nos dices y lo ajustamos.\n\nUn saludo,\nextreweb'),
  ('Seguimiento', '¿Pudiste ver el presupuesto?',
   E'Hola, {nombre}:\n\nTe escribimos por si pudiste revisar el presupuesto o te surgió alguna duda. Estamos a tu disposición.\n\nUn saludo,\nextreweb')
) as v(titulo, asunto, cuerpo)
where not exists (select 1 from public.plantillas);

-- =====================================================================
-- 3. PRESUPUESTOS: estado, IVA y vencimiento de cada cobro
-- =====================================================================

alter table public.presupuestos add column if not exists estado text not null default 'borrador';
alter table public.presupuestos add column if not exists enviado_at timestamptz;
alter table public.presupuestos add column if not exists iva numeric(5,2) not null default 21;
alter table public.presupuestos add column if not exists con_iva boolean not null default false; -- ¿las partidas ya llevan el IVA?
do $$ begin
  alter table public.presupuestos add constraint presupuestos_estado_chk
    check (estado in ('borrador', 'enviado', 'aceptado', 'rechazado'));
exception when duplicate_object then null;
end $$;

alter table public.partidas add column if not exists vence date;  -- cuándo hay que cobrarla

-- =====================================================================
-- 4. PROYECTOS: ficha técnica de la web
-- =====================================================================

alter table public.proyectos add column if not exists web_url        text;
alter table public.proyectos add column if not exists dominio        text;
alter table public.proyectos add column if not exists registrador    text;
alter table public.proyectos add column if not exists dominio_caduca date;
alter table public.proyectos add column if not exists alojamiento    text;
alter table public.proyectos add column if not exists repositorio    text;
alter table public.proyectos add column if not exists notas_tecnicas text;

-- =====================================================================
-- 5. NOTAS RÁPIDAS CON FECHA
-- =====================================================================

alter table public.notas_rapidas add column if not exists fecha date;

-- =====================================================================
-- 6. TABLAS LIGADAS A CLIENTES Y PROYECTOS
-- Se crean con el MISMO tipo de id que ya tengan `clientes` y `proyectos`
-- (número o uuid, según se hicieran), por eso van dentro de este bloque.
-- =====================================================================

do $$
declare
  t_cli text := (select format_type(atttypid, atttypmod) from pg_attribute
                 where attrelid = 'public.clientes'::regclass and attname = 'id');
  t_pro text := (select format_type(atttypid, atttypmod) from pg_attribute
                 where attrelid = 'public.proyectos'::regclass and attname = 'id');
begin
  -- Renovaciones: dominios, alojamiento y cuotas de mantenimiento de cada cliente
  execute format($sql$
    create table if not exists public.renovaciones (
      id          bigint generated always as identity primary key,
      cliente_id  %s not null references public.clientes(id) on delete cascade,
      concepto    text not null,
      tipo        text not null default 'otro'
                  check (tipo in ('dominio', 'alojamiento', 'mantenimiento', 'otro')),
      importe     numeric(10,2) not null default 0,
      periodo     text not null default 'anual'
                  check (periodo in ('mensual', 'trimestral', 'anual')),
      proxima     date not null,
      notas       text,
      activa      boolean not null default true,
      created_at  timestamptz not null default now()
    )$sql$, t_cli);

  -- Webs de clientes que miden sus visitas con nuestro contador
  execute format($sql$
    create table if not exists public.sitios (
      dominio     text primary key,          -- 'guadicar.es' (sin www)
      cliente_id  %s references public.clientes(id) on delete set null,
      nombre      text,
      activo      boolean not null default true,
      created_at  timestamptz not null default now()
    )$sql$, t_cli);

  -- Checklist de lanzamiento: una fila por punto marcado
  execute format($sql$
    create table if not exists public.checklist (
      proyecto_id %s not null references public.proyectos(id) on delete cascade,
      clave       text not null,
      hecho_at    timestamptz not null default now(),
      primary key (proyecto_id, clave)
    )$sql$, t_pro);

  -- Horas dedicadas a cada proyecto
  execute format($sql$
    create table if not exists public.horas (
      id          bigint generated always as identity primary key,
      proyecto_id %s not null references public.proyectos(id) on delete cascade,
      fecha       date not null default current_date,
      minutos     integer not null check (minutos > 0),
      nota        text,
      created_at  timestamptz not null default now()
    )$sql$, t_pro);
end $$;

alter table public.renovaciones enable row level security;
drop policy if exists "auth all" on public.renovaciones;
create policy "auth all" on public.renovaciones for all to authenticated using (true) with check (true);

alter table public.sitios enable row level security;
drop policy if exists "auth all" on public.sitios;
create policy "auth all" on public.sitios for all to authenticated using (true) with check (true);

alter table public.checklist enable row level security;
drop policy if exists "auth all" on public.checklist;
create policy "auth all" on public.checklist for all to authenticated using (true) with check (true);

alter table public.horas enable row level security;
drop policy if exists "auth all" on public.horas;
create policy "auth all" on public.horas for all to authenticated using (true) with check (true);

-- =====================================================================
-- 7. ARCHIVOS DE CADA PROYECTO (Supabase Storage)
-- Carpeta privada: solo se descarga con sesión iniciada y enlaces que caducan.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('archivos', 'archivos', false)
on conflict (id) do nothing;

drop policy if exists "archivos: equipo" on storage.objects;
create policy "archivos: equipo" on storage.objects
  for all to authenticated
  using (bucket_id = 'archivos')
  with check (bucket_id = 'archivos');

-- =====================================================================
-- Limpieza (de vez en cuando, o prográmalo en Supabase → Cron):
--   delete from public.visitas   where creado < now() - interval '12 months';
--   delete from public.velocidad where creado < now() - interval '12 months';
-- =====================================================================
