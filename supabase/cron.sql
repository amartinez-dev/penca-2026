-- Cron opcional para Supabase. Requiere habilitar pg_cron, pg_net y guardar secretos de forma segura.
-- En producción, ajustá la frecuencia para no superar el límite del plan gratis de tu API deportiva.

-- Opción simple desde el Dashboard de Supabase:
-- Database > Cron > New job
-- Schedule: */10 * * * *
-- Request: POST https://TU-PROYECTO.supabase.co/functions/v1/sync-results
-- Header: Authorization: Bearer TU_ANON_O_SERVICE_TOKEN_SEGUN_TU_CONFIGURACION

-- Alternativa SQL avanzada, si usás pg_net:
-- select cron.schedule(
--   'sync-world-cup-results',
--   '*/10 * * * *',
--   $$
--   select net.http_post(
--     url := 'https://TU-PROYECTO.supabase.co/functions/v1/sync-results',
--     headers := jsonb_build_object('Authorization', 'Bearer TU_TOKEN')
--   );
--   $$
-- );
