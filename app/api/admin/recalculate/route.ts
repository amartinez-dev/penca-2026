import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminRequest } from '@/lib/auth';
import { calculatePoints } from '@/lib/scoring';
import { updateBracketProgression } from '@/lib/progression';

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 });

  try {
    const supabase = supabaseAdmin();
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id, home_score, away_score')
      .eq('status', 'finished')
      .not('home_score', 'is', null)
      .not('away_score', 'is', null);

    if (matchesError) throw matchesError;

    let total = 0;
    for (const match of matches || []) {
      const { data: predictions, error: predError } = await supabase
        .from('predictions')
        .select('participant_id, match_id, pred_home, pred_away')
        .eq('match_id', match.id);

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
        total++;
      }
    }

    const progression = await updateBracketProgression(supabase);

    return NextResponse.json({ ok: true, data: { recalculated: total, progression } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'No se pudo recalcular la tabla.' }, { status: 500 });
  }
}
