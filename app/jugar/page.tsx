'use client';

import { useEffect, useMemo, useState } from 'react';
import { TeamBadge } from '@/components/TeamBadge';
import { isMatchResolved, isMatchPredictable } from '@/lib/teamAssets';
import type { Match, Prediction } from '@/lib/types';

type StoredParticipant = { id: string; name: string };
type Drafts = Record<string, { pred_home: string; pred_away: string }>;

const CLOSING_MINUTES = 1;

function getStoredParticipant(): StoredParticipant | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('pencaParticipant');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function statusLabel(status: string) {
  if (status === 'finished') return 'Finalizado';
  if (status === 'live') return 'En vivo';
  if (status === 'not_started') return 'Pendiente';
  if (status === 'postponed') return 'Postergado';
  return status;
}

function canPredict(match: Match) {
  if (!isMatchPredictable(match)) return false;
  return new Date(match.kickoff_at).getTime() > Date.now() + CLOSING_MINUTES * 60_000;
}

function closesAt(match: Match) {
  return new Date(new Date(match.kickoff_at).getTime() - CLOSING_MINUTES * 60_000);
}

export default function PlayPage() {
  const [participant, setParticipant] = useState<StoredParticipant | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [drafts, setDrafts] = useState<Drafts>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'next' | 'missing' | 'all'>('next');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    const stored = getStoredParticipant();
    setParticipant(stored);
    if (!stored) {
      setLoading(false);
      return;
    }

    const [matchesRes, predictionsRes] = await Promise.all([
      fetch('/api/matches', { cache: 'no-store' }).then(r => r.json()),
      fetch(`/api/predictions?participant_id=${stored.id}`, { cache: 'no-store' }).then(r => r.json())
    ]);

    if (!matchesRes.ok) setError(matchesRes.error);
    if (!predictionsRes.ok) setError(predictionsRes.error);

    const loadedMatches = matchesRes.data || [];
    const loadedPredictions = predictionsRes.data || [];
    setMatches(loadedMatches);
    setPredictions(loadedPredictions);

    const nextDrafts: Drafts = {};
    for (const match of loadedMatches) {
      const found = loadedPredictions.find((p: Prediction) => p.match_id === match.id);
      nextDrafts[match.id] = {
        pred_home: found ? String(found.pred_home) : '',
        pred_away: found ? String(found.pred_away) : ''
      };
    }
    setDrafts(nextDrafts);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const predictionMap = useMemo(() => new Map(predictions.map(p => [p.match_id, p])), [predictions]);

  const hiddenFutureMatches = useMemo(
    () => matches.filter(match => match.status !== 'finished' && !isMatchResolved(match)).length,
    [matches]
  );

  const visibleMatches = useMemo(() => {
    const now = Date.now();
    return matches.filter(match => {
      if (!isMatchResolved(match)) return false;
      if (filter === 'all') return true;
      if (filter === 'next') return new Date(match.kickoff_at).getTime() >= now - 4 * 60 * 60_000 && match.status !== 'finished';
      if (filter === 'missing') return !predictionMap.has(match.id) && canPredict(match);
      return true;
    });
  }, [matches, filter, predictionMap]);

  async function savePrediction(matchId: string) {
    if (!participant) return;
    setError(null);
    setMessage(null);
    const draft = drafts[matchId];
    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participant_id: participant.id,
        match_id: matchId,
        pred_home: Number(draft?.pred_home),
        pred_away: Number(draft?.pred_away)
      })
    });
    const json = await res.json();
    if (!json.ok) {
      setError(json.error || 'No se pudo guardar.');
      return;
    }
    setMessage('Pronóstico guardado.');
    await load();
  }

  async function saveAll() {
    const rows = visibleMatches.filter(match => canPredict(match) && drafts[match.id]?.pred_home !== '' && drafts[match.id]?.pred_away !== '');
    for (const match of rows) await savePrediction(match.id);
    setMessage(`Se guardaron ${rows.length} pronósticos.`);
  }

  if (!participant) {
    return (
      <section className="card">
        <h1>Entrá para jugar</h1>
        <p>Primero registrate o entrá con tu nombre y PIN desde la portada.</p>
        <a className="button primary" href="/">Ir al inicio</a>
      </section>
    );
  }

  return (
    <section className="card play-page-card">
      <div className="eyebrow">Hola, {participant.name}</div>
      <h1>Jugar</h1>
      <p>Elegí tus resultados. Cada casillero de goles está junto a su selección.</p>

      <div className="filter-bar compact-filter">
        <button className={`button mini-button ${filter === 'next' ? 'primary' : 'secondary'}`} onClick={() => setFilter('next')}>Próximos</button>
        <button className={`button mini-button ${filter === 'missing' ? 'primary' : 'secondary'}`} onClick={() => setFilter('missing')}>Me faltan</button>
        <button className={`button mini-button ${filter === 'all' ? 'primary' : 'secondary'}`} onClick={() => setFilter('all')}>Todos</button>
      </div>

      <button className="button secondary compact-save" onClick={saveAll}>Guardar visibles</button>

      {hiddenFutureMatches > 0 && (
        <div className="alert section">
          Hay {hiddenFutureMatches} partidos de eliminatorias ocultos porque todavía no se conocen sus selecciones. Se abrirán solos cuando se actualice la llave.
        </div>
      )}
      {message && <div className="alert success section">{message}</div>}
      {error && <div className="alert error section">{error}</div>}
      {loading && <div className="alert section">Cargando partidos...</div>}

      <div className="match-card-list section">
        {visibleMatches.map(match => {
          const locked = !canPredict(match);
          const prediction = predictionMap.get(match.id);
          const draft = drafts[match.id] || { pred_home: '', pred_away: '' };
          return (
            <article className="match-card bet-card" key={match.id}>
              <div className="bet-card-meta">
                <span>{new Date(match.kickoff_at).toLocaleString('es-UY', { dateStyle: 'short', timeStyle: 'short' })}</span>
                <span>{match.stage}{match.group_name ? ` · ${match.group_name}` : ''}</span>
                <span>{match.venue || 'Estadio a confirmar'}{match.city ? ` · ${match.city}` : ''}</span>
              </div>

              <div className="bet-status-row">
                <span className={`badge ${match.status === 'live' ? 'live' : locked ? 'closed' : 'ok'}`}>{statusLabel(match.status)}</span>
                <span className="closing-label">Cierra {closesAt(match).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div className="prediction-editor" aria-label={`Pronóstico para ${match.home_team} contra ${match.away_team}`}>
                <label className="team-score-line">
                  <span className="team-side"><TeamBadge team={match.home_team} /></span>
                  <span className="score-label">Goles</span>
                  <input
                    className="input prediction-input"
                    inputMode="numeric"
                    aria-label={`Goles de ${match.home_team}`}
                    disabled={locked}
                    value={draft.pred_home}
                    onChange={e => setDrafts(prev => ({ ...prev, [match.id]: { ...prev[match.id], pred_home: e.target.value } }))}
                  />
                </label>

                <div className="versus-divider">VS</div>

                <label className="team-score-line">
                  <span className="team-side"><TeamBadge team={match.away_team} /></span>
                  <span className="score-label">Goles</span>
                  <input
                    className="input prediction-input"
                    inputMode="numeric"
                    aria-label={`Goles de ${match.away_team}`}
                    disabled={locked}
                    value={draft.pred_away}
                    onChange={e => setDrafts(prev => ({ ...prev, [match.id]: { ...prev[match.id], pred_away: e.target.value } }))}
                  />
                </label>
              </div>

              {prediction && (
                <div className="saved-prediction">
                  Guardado: {match.home_team} {prediction.pred_home} - {prediction.pred_away} {match.away_team}
                </div>
              )}
              {locked && <div className="locked-note">Pronóstico cerrado</div>}

              <div className="card-actions-grid">
                <a className="button secondary" href={`/partidos/${match.id}`}>Detalles y pronósticos</a>
                <button className="button primary" disabled={locked} onClick={() => savePrediction(match.id)}>Guardar</button>
              </div>
            </article>
          );
        })}
        {!visibleMatches.length && <div className="alert">No hay partidos habilitados para mostrar con este filtro.</div>}
      </div>
    </section>
  );
}
