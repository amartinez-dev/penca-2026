-- Datos de prueba para probar la app sin conectar API-Football.
-- Ejecutar después de schema.sql.

insert into participants(name, name_key, pin_hash) values
  ('Demo Uno', 'demo uno', 'demo'),
  ('Demo Dos', 'demo dos', 'demo')
on conflict (name_key) do nothing;

insert into matches(tournament_match_no, stage, group_name, home_team, away_team, kickoff_at, status, venue, city) values
  (1, 'Grupo', 'Grupo A', 'México', 'Sudáfrica', '2026-06-11 16:00:00-03', 'not_started', 'Estadio Azteca', 'Ciudad de México'),
  (2, 'Grupo', 'Grupo A', 'Canadá', 'Qatar', '2026-06-12 17:00:00-03', 'not_started', 'BMO Field', 'Toronto'),
  (3, 'Grupo', 'Grupo B', 'Uruguay', 'España', '2026-06-13 15:00:00-03', 'not_started', 'Demo Stadium', 'Demo City')
on conflict do nothing;
