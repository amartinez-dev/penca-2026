import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminRequest } from '@/lib/auth';
import { updateBracketProgression } from '@/lib/progression';
import { saveScoreAndNotification } from '@/lib/notifications';

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 });

  try {
    const supabase = supabaseAdmin();
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id, home_team, away_team, home_score, away_score')
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
        await saveScoreAndNotification(supabase, {
          id: match.id,
          home_team: match.home_team,
          away_team: match.away_team,
          home_score: match.home_score,
          away_score: match.away_score
        }, prediction);
        total++;
      }
    }

    const progression = await updateBracketProgression(supabase);

    return NextResponse.json({ ok: true, data: { recalculated: total, progression } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'No se pudo recalcular la tabla. Ejecutá primero el SQL de notificaciones si todavía no lo hiciste.' }, { status: 500 });
  }
}
