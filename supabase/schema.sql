-- Penca Salados 2026 - Base de datos Supabase
-- Ejecutar en Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_key text not null unique,
  pin_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  api_fixture_id bigint unique,
  tournament_match_no integer,
  stage text not null default 'Grupo',
  group_name text,
  home_team text not null,
  away_team text not null,
  kickoff_at timestamptz not null,
  status text not null default 'not_started' check (status in ('not_started', 'live', 'finished', 'postponed', 'cancelled')),
  home_score integer,
  away_score integer,
  venue text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists matches_kickoff_idx on matches(kickoff_at);
create index if not exists matches_status_idx on matches(status);

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  pred_home integer not null check (pred_home >= 0 and pred_home <= 99),
  pred_away integer not null check (pred_away >= 0 and pred_away <= 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(participant_id, match_id)
);

create index if not exists predictions_participant_idx on predictions(participant_id);
create index if not exists predictions_match_idx on predictions(match_id);

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  points integer not null default 0,
  reason text not null default 'Sin acierto',
  exact boolean not null default false,
  hit boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(participant_id, match_id)
);

create index if not exists scores_participant_idx on scores(participant_id);
create index if not exists scores_match_idx on scores(match_id);

create table if not exists settings (
  key text primary key,
  value text not null
);

insert into settings(key, value) values
  ('puntos_exacto', '5'),
  ('puntos_resultado', '3'),
  ('puntos_diferencia', '1'),
  ('cierre_minutos_antes', '15'),
  ('registro_abierto', 'true')
on conflict (key) do nothing;

create or replace view leaderboard as
select
  p.id as participant_id,
  p.name,
  coalesce(sum(s.points), 0)::integer as points,
  coalesce(sum(case when s.exact then 1 else 0 end), 0)::integer as exactos,
  coalesce(sum(case when s.hit then 1 else 0 end), 0)::integer as aciertos,
  coalesce(count(s.match_id), 0)::integer as jugados
from participants p
left join scores s on s.participant_id = p.id
group by p.id, p.name;

-- Para esta app, las operaciones pasan por rutas API de Next.js usando SERVICE_ROLE_KEY.
-- Por eso dejamos RLS activable a futuro, pero desactivado para simplificar el MVP escolar.
alter table participants disable row level security;
alter table matches disable row level security;
alter table predictions disable row level security;
alter table scores disable row level security;
alter table settings disable row level security;
