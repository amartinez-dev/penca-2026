export type ScoreInput = {
  pred_home: number;
  pred_away: number;
  home_score: number;
  away_score: number;
};

function outcome(home: number, away: number) {
  if (home > away) return 'home';
  if (away > home) return 'away';
  return 'draw';
}

export function calculatePoints(input: ScoreInput) {
  const exact = input.pred_home === input.home_score && input.pred_away === input.away_score;
  if (exact) {
    return { points: 5, reason: 'Marcador exacto', exact: true, hit: true };
  }

  const predictedOutcome = outcome(input.pred_home, input.pred_away);
  const actualOutcome = outcome(input.home_score, input.away_score);
  const predictedDiff = input.pred_home - input.pred_away;
  const actualDiff = input.home_score - input.away_score;

  if (predictedOutcome === actualOutcome) {
    const diffBonus = predictedDiff === actualDiff ? 1 : 0;
    return {
      points: 3 + diffBonus,
      reason: diffBonus ? 'Acierto de resultado y diferencia' : 'Acierto de resultado',
      exact: false,
      hit: true
    };
  }

  return { points: 0, reason: 'Sin acierto', exact: false, hit: false };
}
