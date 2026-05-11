import type { SupabaseClient } from '@supabase/supabase-js';

type SupabaseLike = SupabaseClient<any, any, any>;

type DbMatch = {
  id: string;
  tournament_match_no: number | null;
  stage: string;
  group_name: string | null;
  home_team: string;
  away_team: string;
  home_source?: string | null;
  away_source?: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
  winner_team?: string | null;
};

type TeamStats = {
  team: string;
  group: string;
  played: number;
  points: number;
  gf: number;
  ga: number;
  gd: number;
  wins: number;
};

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const THIRD_PLACE_MATCH_ORDER: Array<{ matchNo: number; source: string }> = [
  { matchNo: 79, source: '3C/E/F/H/I' }, // 1A
  { matchNo: 85, source: '3E/F/G/I/J' }, // 1B
  { matchNo: 81, source: '3B/E/F/I/J' }, // 1D
  { matchNo: 74, source: '3A/B/C/D/F' }, // 1E
  { matchNo: 82, source: '3A/E/H/I/J' }, // 1G
  { matchNo: 77, source: '3C/D/F/G/H' }, // 1I
  { matchNo: 87, source: '3D/E/I/J/L' }, // 1K
  { matchNo: 80, source: '3E/H/I/J/K' }  // 1L
];

function groupLetter(groupName: string | null) {
  const match = String(groupName || '').match(/[A-L]$/i);
  return match ? match[0].toUpperCase() : null;
}

function isFinishedWithScore(match: DbMatch) {
  return match.status === 'finished' && match.home_score !== null && match.away_score !== null;
}

function getWinner(match: DbMatch | undefined) {
  if (!match || !isFinishedWithScore(match)) return null;
  if (match.winner_team) return match.winner_team;
  if ((match.home_score as number) > (match.away_score as number)) return match.home_team;
  if ((match.away_score as number) > (match.home_score as number)) return match.away_team;
  return null;
}

function getLoser(match: DbMatch | undefined) {
  if (!match || !isFinishedWithScore(match)) return null;
  const winner = getWinner(match);
  if (!winner) return null;
  if (winner === match.home_team) return match.away_team;
  if (winner === match.away_team) return match.home_team;
  return null;
}

function ensureStats(map: Map<string, TeamStats>, team: string, group: string) {
  const key = `${group}:${team}`;
  const existing = map.get(key);
  if (existing) return existing;
  const next: TeamStats = { team, group, played: 0, points: 0, gf: 0, ga: 0, gd: 0, wins: 0 };
  map.set(key, next);
  return next;
}

function rankTeams(rows: TeamStats[]) {
  return [...rows].sort((a, b) =>
    b.points - a.points ||
    b.gd - a.gd ||
    b.gf - a.gf ||
    b.wins - a.wins ||
    a.team.localeCompare(b.team)
  );
}

function getGroupStandings(matches: DbMatch[]) {
  const placements = new Map<string, string>();
  const thirds: TeamStats[] = [];
  let completedGroups = 0;

  for (const group of GROUPS) {
    const groupMatches = matches.filter(match => groupLetter(match.group_name) === group && match.stage.toLowerCase().includes('grupo'));
    const finished = groupMatches.filter(isFinishedWithScore);
    if (groupMatches.length < 6 || finished.length < 6) continue;

    completedGroups++;
    const map = new Map<string, TeamStats>();

    for (const match of finished) {
      const home = ensureStats(map, match.home_team, group);
      const away = ensureStats(map, match.away_team, group);
      const hs = match.home_score as number;
      const as = match.away_score as number;

      home.played++; away.played++;
      home.gf += hs; home.ga += as; home.gd = home.gf - home.ga;
      away.gf += as; away.ga += hs; away.gd = away.gf - away.ga;

      if (hs > as) { home.points += 3; home.wins++; }
      else if (as > hs) { away.points += 3; away.wins++; }
      else { home.points += 1; away.points += 1; }
    }

    const ranked = rankTeams([...map.values()]);
    if (ranked[0]) placements.set(`1${group}`, ranked[0].team);
    if (ranked[1]) placements.set(`2${group}`, ranked[1].team);
    if (ranked[2]) {
      placements.set(`3${group}`, ranked[2].team);
      thirds.push(ranked[2]);
    }
  }

  const bestThirds = completedGroups === GROUPS.length ? rankTeams(thirds).slice(0, 8) : [];
  return { placements, bestThirds, completedGroups };
}

function sourceCandidates(source: string) {
  // Ej: 3A/B/C/D/F -> A,B,C,D,F
  return source.replace(/^3/, '').split('/').map(item => item.trim().toUpperCase()).filter(Boolean);
}

function resolveThirdPlaceSlots(bestThirds: TeamStats[]) {
  const bySource = new Map<string, string>();
  const usedGroups = new Set<string>();

  if (bestThirds.length < 8) return bySource;

  for (const slot of THIRD_PLACE_MATCH_ORDER) {
    const candidates = sourceCandidates(slot.source);
    const selected = bestThirds.find(team => candidates.includes(team.group) && !usedGroups.has(team.group));
    if (selected) {
      usedGroups.add(selected.group);
      bySource.set(slot.source, selected.team);
    }
  }

  return bySource;
}

function normalizeSource(source: string | null | undefined, fallback: string) {
  return String(source || fallback || '').trim();
}

function resolveSource(source: string, placements: Map<string, string>, thirdSlots: Map<string, string>, matchByNo: Map<number, DbMatch>) {
  if (!source) return null;

  const groupPlacement = placements.get(source);
  if (groupPlacement) return groupPlacement;

  if (/^3[A-L](\/[A-L])+/i.test(source)) {
    return thirdSlots.get(source) || null;
  }

  const win = source.match(/^W(\d+)$/i);
  if (win) return getWinner(matchByNo.get(Number(win[1])));

  const lose = source.match(/^L(\d+)$/i);
  if (lose) return getLoser(matchByNo.get(Number(lose[1])));

  return null;
}

export async function updateBracketProgression(supabase: SupabaseLike) {
  const { data, error } = await supabase
    .from('matches')
    .select('id,tournament_match_no,stage,group_name,home_team,away_team,home_source,away_source,status,home_score,away_score,winner_team')
    .order('tournament_match_no', { ascending: true });

  if (error) throw error;

  const matches = (data || []) as DbMatch[];
  const matchByNo = new Map<number, DbMatch>();
  for (const match of matches) {
    if (match.tournament_match_no !== null) matchByNo.set(match.tournament_match_no, match);
  }

  const { placements, bestThirds, completedGroups } = getGroupStandings(matches);
  const thirdSlots = resolveThirdPlaceSlots(bestThirds);

  let updated = 0;

  for (const match of matches) {
    if (!match.tournament_match_no || match.tournament_match_no < 73 || match.status === 'finished') continue;

    const homeSource = normalizeSource(match.home_source, match.home_team);
    const awaySource = normalizeSource(match.away_source, match.away_team);
    const nextHome = resolveSource(homeSource, placements, thirdSlots, matchByNo);
    const nextAway = resolveSource(awaySource, placements, thirdSlots, matchByNo);

    const patch: { home_team?: string; away_team?: string; updated_at: string; notes?: string } = { updated_at: new Date().toISOString() };
    if (nextHome && nextHome !== match.home_team) patch.home_team = nextHome;
    if (nextAway && nextAway !== match.away_team) patch.away_team = nextAway;

    if (Object.keys(patch).length > 1) {
      if (completedGroups === GROUPS.length && (homeSource.startsWith('3') || awaySource.startsWith('3'))) {
        patch.notes = 'Llave actualizada automáticamente según tabla de grupos y mejores terceros.';
      }
      const { error: updateError } = await supabase.from('matches').update(patch).eq('id', match.id);
      if (updateError) throw updateError;
      updated++;
    }
  }

  return { updated, completedGroups, bestThirds: bestThirds.map(team => `${team.team} (${team.group})`) };
}
