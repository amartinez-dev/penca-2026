-- Upgrade profesional Penca 2026
-- Ejecutar UNA VEZ en Supabase SQL Editor después de cargar los fixtures.
-- No borra participantes ni pronósticos.

begin;

alter table matches add column if not exists home_source text;
alter table matches add column if not exists away_source text;
alter table matches add column if not exists winner_team text;
alter table matches add column if not exists home_lineup text;
alter table matches add column if not exists away_lineup text;
alter table matches add column if not exists notes text;

-- Guardamos el casillero original de cada partido.
-- Ej: para grupos queda Argentina/Uruguay; para llaves queda 1A, W73, 3C/E/F/H/I, etc.
update matches
set
  home_source = coalesce(home_source, home_team),
  away_source = coalesce(away_source, away_team)
where home_source is null or away_source is null;

-- Cierre automático pedido: 1 minuto antes del inicio del partido.
insert into settings(key, value) values ('cierre_minutos_antes', '1')
on conflict (key) do update set value = excluded.value;

commit;
