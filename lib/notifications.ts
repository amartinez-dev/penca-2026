import { calculatePoints } from '@/lib/scoring';

type SupabaseLike = any;

type MatchForScore = {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
};

type PredictionForScore = {
  participant_id: string;
  match_id: string;
  pred_home: number;
  pred_away: number;
};

export async function saveScoreAndNotification(
  supabase: SupabaseLike,
  match: MatchForScore,
  prediction: PredictionForScore
) {
  const result = calculatePoints({
    pred_home: prediction.pred_home,
    pred_away: prediction.pred_away,
    home_score: match.home_score,
    away_score: match.away_score
  });

  const now = new Date().toISOString();

  const { error: scoreError } = await supabase.from('scores').upsert({
    participant_id: prediction.participant_id,
    match_id: prediction.match_id,
    points: result.points,
    reason: result.reason,
    exact: result.exact,
    hit: result.hit,
    updated_at: now
  }, { onConflict: 'participant_id,match_id' });

  if (scoreError) throw scoreError;

  if (result.points > 0) {
    const message = `${result.reason}: ${match.home_team} ${match.home_score} - ${match.away_score} ${match.away_team}. La tabla de posiciones ya fue actualizada.`;

    const { error: notificationError } = await supabase.from('notifications').upsert({
      participant_id: prediction.participant_id,
      match_id: prediction.match_id,
      points: result.points,
      title: `¡Sumaste ${result.points} puntos!`,
      message,
      is_read: false,
      updated_at: now
    }, { onConflict: 'participant_id,match_id' });

    if (notificationError) throw notificationError;
  } else {
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('participant_id', prediction.participant_id)
      .eq('match_id', prediction.match_id);

    if (deleteError) throw deleteError;
  }

  return result;
}
