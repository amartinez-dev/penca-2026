-- Upgrade Penca 2026: regla Opción B + notificaciones
-- Ejecutar una sola vez en Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  points integer not null default 0,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(participant_id, match_id)
);

create index if not exists notifications_participant_idx on notifications(participant_id);
create index if not exists notifications_unread_idx on notifications(participant_id, is_read);

insert into settings(key, value) values
  ('puntos_exacto', '5'),
  ('puntos_resultado', '2'),
  ('puntos_diferencia', '0'),
  ('cierre_minutos_antes', '1')
on conflict (key) do update set value = excluded.value;

alter table notifications disable row level security;

-- Limpia puntajes viejos para que se recalculen con la regla nueva.
delete from notifications;
delete from scores;
