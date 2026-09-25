-- supabase/resenas.sql
-- Pedir reseñas de extreweb en Google a los clientes (26/09/2026).
-- Ejecutar UNA vez en Supabase → SQL Editor. Se puede repetir sin romper nada.
--
-- El enlace de reseñas y los textos del mensaje se guardan en la tabla `ajustes`
-- (claves resenas_url, resenas_mensaje y resenas_recordatorio) desde el panel.

alter table public.clientes add column if not exists resena_pedida_at    timestamptz;  -- primera vez que se pidió
alter table public.clientes add column if not exists resena_canal        text;         -- 'whatsapp' | 'email' | 'otro'
alter table public.clientes add column if not exists resena_recordada_at timestamptz;  -- recordatorio (una vez)
alter table public.clientes add column if not exists resena_recibida_at  timestamptz;  -- ya la ha dejado
