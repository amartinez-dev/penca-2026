import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminRequest } from '@/lib/auth';
import { updateBracketProgression } from '@/lib/progression';
import { saveScoreAndNotification } from '@/lib/notifications';

function isKnockoutStage(stage: string) {
  return !stage.toLowerCase().includes('grupo');
}

async function recalculateMatch(matchId: string) {
  const supabase = supabaseAdmin();
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, home_team, away_team, home_score, away_score, status')
    .eq('id', matchId)
    .single();

  if (matchError || !match || match.home_score === null || match.away_score === null || match.status !== 'finished') return 0;

  const { data: predictions, error: predError } = await supabase
    .from('predictions')
    .select('participant_id, match_id, pred_home, pred_away')
    .eq('match_id', matchId);

  if (predError) throw predError;

  let total = 0;
  for (const prediction of predictions || []) {
    await saveScoreAndNotification(supabase, {
      id: match.id,
      home_team: match.home_team,
      away_team: match.away_team,
      home_score: match.home_score,
      away_score: match.away_score
    }, prediction);
    total++;
  }

  return total;
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 });

  try {
    const body = await request.json();
    const matchId = String(body.match_id || '');
    const home_score = Number(body.home_score);
    const away_score = Number(body.away_score);
    const winnerFromAdmin = body.winner_team ? String(body.winner_team).trim() : null;

    if (!matchId || !Number.isInteger(home_score) || !Number.isInteger(away_score) || home_score < 0 || away_score < 0) {
      return NextResponse.json({ ok: false, error: 'Resultado inválido.' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, stage, home_team, away_team')
      .eq('id', matchId)
      .single();

    if (matchError || !match) return NextResponse.json({ ok: false, error: 'Partido no encontrado.' }, { status: 404 });

    let winner_team: string | null = null;
    if (home_score > away_score) winner_team = match.home_team;
    if (away_score > home_score) winner_team = match.away_team;

    if (home_score === away_score && isKnockoutStage(match.stage)) {
      if (!winnerFromAdmin || ![match.home_team, match.away_team].includes(winnerFromAdmin)) {
        return NextResponse.json({ ok: false, error: 'En eliminatorias, si empatan, elegí quién avanzó por penales.' }, { status: 400 });
      }
      winner_team = winnerFromAdmin;
    }

    const { error } = await supabase
      .from('matches')
      .update({ home_score, away_score, winner_team, status: 'finished', updated_at: new Date().toISOString() })
      .eq('id', matchId);

    if (error) throw error;

    const recalculated = await recalculateMatch(matchId);
    const progression = await updateBracketProgression(supabase);

    return NextResponse.json({ ok: true, data: { match_id: matchId, recalculated, progression } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'No se pudo guardar el resultado.' }, { status: 500 });
  }
}
