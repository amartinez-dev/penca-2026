export type Participant = {
  id: string;
  name: string;
  name_key: string;
  created_at: string;
};

export type MatchStatus = 'not_started' | 'live' | 'finished' | 'postponed' | 'cancelled';

export type Match = {
  id: string;
  api_fixture_id: number | null;
  tournament_match_no: number | null;
  stage: string;
  group_name: string | null;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  city: string | null;
  home_source: string | null;
  away_source: string | null;
  winner_team: string | null;
  home_lineup: string | null;
  away_lineup: string | null;
  notes: string | null;
};

export type Prediction = {
  id: string;
  participant_id: string;
  match_id: string;
  pred_home: number;
  pred_away: number;
  created_at: string;
  updated_at: string;
};

export type MatchPredictionRow = {
  id: string;
  name: string;
  pred_home: number;
  pred_away: number;
  updated_at: string;
};

export type LeaderboardRow = {
  participant_id: string;
  name: string;
  points: number;
  exactos: number;
  aciertos: number;
  jugados: number;
};

export type NotificationRow = {
  id: string;
  participant_id: string;
  match_id: string;
  points: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
