// Supabase Edge Function opcional para sincronizar resultados con API-Football.
// Deploy:
//   supabase functions deploy sync-results
// Secrets:
//   supabase secrets set API_FOOTBALL_KEY=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_URL=...

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

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

function outcome(home: number, away: number) {
  if (home > away) return 'home';
  if (away > home) return 'away';
  return 'draw';
}

function calculatePoints(predHome: number, predAway: number, realHome: number, realAway: number) {
  if (predHome === realHome && predAway === realAway) {
    return { points: 5, reason: 'Marcador exacto', exact: true, hit: true };
  }
  if (outcome(predHome, predAway) === outcome(realHome, realAway)) {
    const diffBonus = predHome - predAway === realHome - realAway ? 1 : 0;
    return {
      points: 3 + diffBonus,
      reason: diffBonus ? 'Acierto de resultado y diferencia' : 'Acierto de resultado',
      exact: false,
      hit: true
    };
  }
  return { points: 0, reason: 'Sin acierto', exact: false, hit: false };
}

serve(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apiKey = Deno.env.get('API_FOOTBALL_KEY')!;
    const host = Deno.env.get('API_FOOTBALL_HOST') || 'v3.football.api-sports.io';
    const league = Deno.env.get('API_FOOTBALL_LEAGUE_ID') || '1';
    const season = Deno.env.get('API_FOOTBALL_SEASON') || '2026';

    const supabase = createClient(supabaseUrl, serviceRole);
    const response = await fetch(`https://${host}/fixtures?league=${league}&season=${season}`, {
      headers: { 'x-apisports-key': apiKey }
    });

    if (!response.ok) throw new Error(`API-Football status ${response.status}`);
    const payload = await response.json();
    const fixtures: ApiFixture[] = payload.response || [];
    let upserted = 0;
    let recalculated = 0;

    for (const item of fixtures) {
      const status = mapStatus(item.fixture.status.short);
      const { data: match, error } = await supabase.from('matches').upsert({
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
      }, { onConflict: 'api_fixture_id' }).select('id, status, home_score, away_score').single();

      if (error) throw error;
      upserted++;

      if (match.status === 'finished' && match.home_score !== null && match.away_score !== null) {
        const { data: predictions, error: predError } = await supabase
          .from('predictions')
          .select('participant_id, match_id, pred_home, pred_away')
          .eq('match_id', match.id);

        if (predError) throw predError;
        for (const prediction of predictions || []) {
          const result = calculatePoints(prediction.pred_home, prediction.pred_away, match.home_score, match.away_score);
          const { error: scoreError } = await supabase.from('scores').upsert({
            participant_id: prediction.participant_id,
            match_id: prediction.match_id,
            points: result.points,
            reason: result.reason,
            exact: result.exact,
            hit: result.hit,
            updated_at: new Date().toISOString()
          }, { onConflict: 'participant_id,match_id' });
          if (scoreError) throw scoreError;
          recalculated++;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, fixtures: fixtures.length, upserted, recalculated }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
});
