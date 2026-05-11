import type { Match } from '@/lib/types';

const COUNTRY_CODES: Record<string, string> = {
  'argentina': 'ar',
  'algeria': 'dz',
  'australia': 'au',
  'austria': 'at',
  'belgium': 'be',
  'bélgica': 'be',
  'bosnia & herzegovina': 'ba',
  'bosnia and herzegovina': 'ba',
  'bosnia y herzegovina': 'ba',
  'brazil': 'br',
  'brasil': 'br',
  'canada': 'ca',
  'canadá': 'ca',
  'cape verde': 'cv',
  'cabo verde': 'cv',
  'colombia': 'co',
  'croatia': 'hr',
  'croacia': 'hr',
  'curaçao': 'cw',
  'curacao': 'cw',
  'czech republic': 'cz',
  'república checa': 'cz',
  'chequia': 'cz',
  'dr congo': 'cd',
  'congo dr': 'cd',
  'república democrática del congo': 'cd',
  'ecuador': 'ec',
  'egypt': 'eg',
  'egipto': 'eg',
  'england': 'gb-eng',
  'inglaterra': 'gb-eng',
  'france': 'fr',
  'francia': 'fr',
  'germany': 'de',
  'alemania': 'de',
  'ghana': 'gh',
  'haiti': 'ht',
  'haití': 'ht',
  'iran': 'ir',
  'irán': 'ir',
  'iraq': 'iq',
  'irak': 'iq',
  'ivory coast': 'ci',
  'costa de marfil': 'ci',
  'japan': 'jp',
  'japón': 'jp',
  'jordan': 'jo',
  'jordania': 'jo',
  'mexico': 'mx',
  'méxico': 'mx',
  'morocco': 'ma',
  'marruecos': 'ma',
  'netherlands': 'nl',
  'países bajos': 'nl',
  'new zealand': 'nz',
  'nueva zelanda': 'nz',
  'norway': 'no',
  'noruega': 'no',
  'panama': 'pa',
  'panamá': 'pa',
  'paraguay': 'py',
  'portugal': 'pt',
  'qatar': 'qa',
  'saudi arabia': 'sa',
  'arabia saudita': 'sa',
  'scotland': 'gb-sct',
  'escocia': 'gb-sct',
  'senegal': 'sn',
  'south africa': 'za',
  'sudáfrica': 'za',
  'south korea': 'kr',
  'corea del sur': 'kr',
  'spain': 'es',
  'españa': 'es',
  'sweden': 'se',
  'suecia': 'se',
  'switzerland': 'ch',
  'suiza': 'ch',
  'tunisia': 'tn',
  'túnez': 'tn',
  'turkey': 'tr',
  'turquía': 'tr',
  'usa': 'us',
  'united states': 'us',
  'estados unidos': 'us',
  'uruguay': 'uy',
  'uzbekistan': 'uz',
  'uzbekistán': 'uz'
};

export function normalizeTeamKey(team: string | null | undefined) {
  return String(team || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function isPlaceholderTeam(team: string | null | undefined) {
  const value = String(team || '').trim();
  if (!value) return true;
  const normalized = normalizeTeamKey(value);
  if (['por definir', 'a confirmar', 'tbd', 'to be decided', 'undefined'].includes(normalized)) return true;
  if (/^[123][A-L](\/[A-L])*$/.test(value.toUpperCase())) return true;
  if (/^[WL]\d{1,3}$/i.test(value)) return true;
  if (/mejor tercero/i.test(value)) return true;
  if (/ganador|perdedor|winner|loser/i.test(value)) return true;
  return false;
}

export function getCountryCode(team: string | null | undefined) {
  const raw = String(team || '').trim();
  if (!raw || isPlaceholderTeam(raw)) return null;
  return COUNTRY_CODES[raw.toLowerCase()] || COUNTRY_CODES[normalizeTeamKey(raw)] || null;
}

export function getTeamInitials(team: string | null | undefined) {
  const value = String(team || '?').trim();
  if (isPlaceholderTeam(value)) return '?';
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return parts.slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

export function isMatchResolved(match: Pick<Match, 'home_team' | 'away_team'>) {
  return !isPlaceholderTeam(match.home_team) && !isPlaceholderTeam(match.away_team);
}

export function isMatchPredictable(match: Pick<Match, 'home_team' | 'away_team' | 'status'>) {
  return match.status === 'not_started' && isMatchResolved(match);
}
