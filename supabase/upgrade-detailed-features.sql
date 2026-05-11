-- Upgrade Penca 2026: más detalles, cierre 1 minuto antes, ganadores y avance automático de llaves.
-- Ejecutar UNA VEZ en Supabase SQL Editor.
-- No borra participantes, pronósticos ni resultados.

begin;

alter table matches add column if not exists home_source text;
alter table matches add column if not exists away_source text;
alter table matches add column if not exists winner_team text;
alter table matches add column if not exists home_lineup text;
alter table matches add column if not exists away_lineup text;
alter table matches add column if not exists notes text;

-- Guardamos el origen de cada casillero. Ej: 1A, 2B, W73, L101.
update matches
set
  home_source = coalesce(home_source, home_team),
  away_source = coalesce(away_source, away_team)
where home_source is null or away_source is null;

-- El usuario pidió cierre automático 1 minuto antes.
insert into settings(key, value) values ('cierre_minutos_antes', '1')
on conflict (key) do update set value = excluded.value;

commit;
