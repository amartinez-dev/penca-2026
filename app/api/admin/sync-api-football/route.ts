import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminRequest } from '@/lib/auth';
import { calculatePoints } from '@/lib/scoring';

type ApiFixture = {
  fixture: { id: number; date: string; status: { short: string }; venue?: { name?: string; city?: string } };
  league?: { round?: string };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number | null; away: number | null };
};

function mapStatus(short: string) {
  if (['FT', 'AET', 'PEN'].includes(short)) return 'finished';
  if (['1H', '2H', 'HT', 'ET', 'P', 'BT', 'INT', 'LIVE'].includes(short)) return 'live';
  if (['PST'].includes(short)) return 'postponed';
  if (['CANC', 'ABD'].includes(short)) return 'cancelled';
  return 'not_started';
}

async function recalculateFinishedMatch(matchId: string) {
  const supabase = supabaseAdmin();
  const { data: match } = await supabase
    .from('matches')
    .select('id, home_score, away_score, status')
    .eq('id', matchId)
    .single();

  if (!match || match.status !== 'finished' || match.home_score === null || match.away_score === null) return 0;

  const { data: predictions, error: predError } = await supabase
    .from('predictions')
    .select('participant_id, match_id, pred_home, pred_away')
    .eq('match_id', matchId);

  if (predError) throw predError;
  let count = 0;

  for (const prediction of predictions || []) {
    const result = calculatePoints({
      pred_home: prediction.pred_home,
      pred_away: prediction.pred_away,
      home_score: match.home_score,
      away_score: match.away_score
    });

    const { error } = await supabase.from('scores').upsert({
      participant_id: prediction.participant_id,
      match_id: prediction.match_id,
      points: result.points,
      reason: result.reason,
      exact: result.exact,
      hit: result.hit,
      updated_at: new Date().toISOString()
    }, { onConflict: 'participant_id,match_id' });

    if (error) throw error;
    count++;
  }

  return count;
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 });

  try {
    const apiKey = process.env.API_FOOTBALL_KEY;
    const host = process.env.API_FOOTBALL_HOST || 'v3.football.api-sports.io';
    const league = process.env.API_FOOTBALL_LEAGUE_ID || '1';
    const season = process.env.API_FOOTBALL_SEASON || '2026';
    if (!apiKey) return NextResponse.json({ ok: false, error: 'Falta API_FOOTBALL_KEY.' }, { status: 400 });

    const url = `https://${host}/fixtures?league=${league}&season=${season}`;
    const response = await fetch(url, { headers: { 'x-apisports-key': apiKey } });
    if (!response.ok) throw new Error(`API-Football respondió ${response.status}`);
    const payload = await response.json();
    const fixtures: ApiFixture[] = payload.response || [];

    const supabase = supabaseAdmin();
    let upserted = 0;
    let recalculated = 0;

    for (const item of fixtures) {
      const status = mapStatus(item.fixture.status.short);
      const { data, error } = await supabase
        .from('matches')
        .upsert({
          api_fixture_id: item.fixture.id,
          stage: item.league?.round || 'Mundial 2026',
          home_team: item.teams.home.name,
          away_team: item.teams.away.name,
          kickoff_at: item.fixture.date,
          status,
          home_score: item.goals.home,
          away_score: item.goals.away,
          venue: item.fixture.venue?.name || null,
          city: item.fixture.venue?.city || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'api_fixture_id' })
        .select('id, status')
        .single();

      if (error) throw error;
      upserted++;
      if (data?.status === 'finished') recalculated += await recalculateFinishedMatch(data.id);
    }

    return NextResponse.json({ ok: true, data: { fixtures: fixtures.length, upserted, recalculated } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'No se pudo sincronizar API-Football.' }, { status: 500 });
  }
}
