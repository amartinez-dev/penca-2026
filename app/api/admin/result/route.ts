import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminRequest } from '@/lib/auth';
import { calculatePoints } from '@/lib/scoring';

async function recalculateMatch(matchId: string) {
  const supabase = supabaseAdmin();
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, home_score, away_score, status')
    .eq('id', matchId)
    .single();

  if (matchError || !match || match.home_score === null || match.away_score === null || match.status !== 'finished') return;

  const { data: predictions, error: predError } = await supabase
    .from('predictions')
    .select('participant_id, match_id, pred_home, pred_away')
    .eq('match_id', matchId);

  if (predError) throw predError;

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
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 });

  try {
    const body = await request.json();
    const matchId = String(body.match_id || '');
    const home_score = Number(body.home_score);
    const away_score = Number(body.away_score);

    if (!matchId || !Number.isInteger(home_score) || !Number.isInteger(away_score) || home_score < 0 || away_score < 0) {
      return NextResponse.json({ ok: false, error: 'Resultado inválido.' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { error } = await supabase
      .from('matches')
      .update({ home_score, away_score, status: 'finished', updated_at: new Date().toISOString() })
      .eq('id', matchId);

    if (error) throw error;
    await recalculateMatch(matchId);

    return NextResponse.json({ ok: true, data: { match_id: matchId } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'No se pudo guardar el resultado.' }, { status: 500 });
  }
}
