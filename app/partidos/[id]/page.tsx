'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { TeamBadge } from '@/components/TeamBadge';
import { isMatchPredictable, isMatchResolved } from '@/lib/teamAssets';
import type { Match, MatchPredictionRow, Prediction } from '@/lib/types';

type StoredParticipant = { id: string; name: string };

type Draft = {
  pred_home: string;
  pred_away: string;
};

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

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [participant, setParticipant] = useState<StoredParticipant | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [predictions, setPredictions] = useState<MatchPredictionRow[]>([]);
  const [myPrediction, setMyPrediction] = useState<Prediction | null>(null);
  const [draft, setDraft] = useState<Draft>({ pred_home: '', pred_away: '' });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(matchId: string) {
    setError(null);
    const stored = getStoredParticipant();
    setParticipant(stored);

    const [matchRes, predRes, myPredRes] = await Promise.all([
      fetch(`/api/matches/${matchId}`, { cache: 'no-store' }).then(r => r.json()),
      fetch(`/api/matches/${matchId}/predictions`, { cache: 'no-store' }).then(r => r.json()),
      stored ? fetch(`/api/predictions?participant_id=${stored.id}`, { cache: 'no-store' }).then(r => r.json()) : Promise.resolve({ ok: true, data: [] })
    ]);

    if (!matchRes.ok) setError(matchRes.error || 'No se pudo cargar el partido.');
    else setMatch(matchRes.data);

    if (!predRes.ok) setError(predRes.error || 'No se pudieron cargar los pronósticos.');
    else setPredictions(predRes.data || []);

    if (myPredRes.ok) {
      const found = (myPredRes.data || []).find((p: Prediction) => p.match_id === matchId) || null;
      setMyPrediction(found);
      setDraft({
        pred_home: found ? String(found.pred_home) : '',
        pred_away: found ? String(found.pred_away) : ''
      });
    }
  }

  useEffect(() => {
    load(id);
    const interval = setInterval(() => load(id), 30000);
    return () => clearInterval(interval);
  }, [id]);

  const summary = useMemo(() => {
    return {
      home: predictions.filter(row => row.pred_home > row.pred_away).length,
      draw: predictions.filter(row => row.pred_home === row.pred_away).length,
      away: predictions.filter(row => row.pred_away > row.pred_home).length
    };
  }, [predictions]);

  async function savePrediction() {
    if (!participant || !match) return;
    setMessage(null);
    setError(null);

    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participant_id: participant.id,
        match_id: match.id,
        pred_home: Number(draft.pred_home),
        pred_away: Number(draft.pred_away)
      })
    });

    const json = await res.json();
    if (!json.ok) {
      setError(json.error || 'No se pudo guardar el pronóstico.');
      return;
    }

    setMessage('Pronóstico guardado.');
    await load(match.id);
  }

  if (error) return <section className="card"><div className="alert error">{error}</div></section>;
  if (!match) return <section className="card"><div className="alert">Cargando partido...</div></section>;

  const resolved = isMatchResolved(match);
  const locked = !canPredict(match);

  return (
    <section className="card match-detail-page">
      <div className="eyebrow">Detalle del partido</div>
      <h1>{match.home_team} vs {match.away_team}</h1>

      <div className="detail-scoreboard section">
        <div className="detail-team"><TeamBadge team={match.home_team} size="lg" /></div>
        <div className="detail-center">
          <span className="badge">{statusLabel(match.status)}</span>
          <strong>{match.home_score === null ? 'VS' : `${match.home_score} - ${match.away_score}`}</strong>
          <small>Cierra {closesAt(match).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}</small>
        </div>
        <div className="detail-team"><TeamBadge team={match.away_team} size="lg" /></div>
      </div>

      <p className="section">
        {new Date(match.kickoff_at).toLocaleString('es-UY', { dateStyle: 'full', timeStyle: 'short' })} · {match.stage}{match.group_name ? ` · ${match.group_name}` : ''}
      </p>
      {!resolved && <div className="alert section">Este partido todavía no acepta pronósticos porque falta definir al menos una selección.</div>}

      <div className="grid two section">
        <div className="card flat">
          <h2>Mi pronóstico</h2>
          {!participant && (
            <div className="alert section">Entrá desde el inicio para cargar tu pronóstico.</div>
          )}
          {participant && (
            <>
              <div className="prediction-editor compact-editor section">
                <label className="team-score-line">
                  <span className="team-side"><TeamBadge team={match.home_team} /></span>
                  <span className="score-label">Goles</span>
                  <input
                    className="input prediction-input"
                    inputMode="numeric"
                    aria-label={`Goles de ${match.home_team}`}
                    disabled={locked}
                    value={draft.pred_home}
                    onChange={e => setDraft(prev => ({ ...prev, pred_home: e.target.value }))}
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
                    onChange={e => setDraft(prev => ({ ...prev, pred_away: e.target.value }))}
                  />
                </label>
              </div>
              {myPrediction && (
                <div className="saved-prediction section">
                  Guardado: {match.home_team} {myPrediction.pred_home} - {myPrediction.pred_away} {match.away_team}
                </div>
              )}
              {message && <div className="alert success section">{message}</div>}
              {locked && <div className="locked-note">Pronóstico cerrado</div>}
              <button className="button primary section" disabled={locked} onClick={savePrediction}>Guardar pronóstico</button>
            </>
          )}
        </div>

        <div className="card flat">
          <h2>Información</h2>
          <p><strong>Estadio:</strong> {match.venue || 'A confirmar'}</p>
          <p><strong>Ciudad:</strong> {match.city || 'A confirmar'}</p>
          <p><strong>Casillero original:</strong> {match.home_source || match.home_team} vs {match.away_source || match.away_team}</p>
          <p>{match.notes || 'Sin notas adicionales por ahora.'}</p>
        </div>
      </div>

      <div className="grid two section">
        <div className="card flat">
          <h2>Alineaciones</h2>
          <p><strong>{match.home_team}:</strong> {match.home_lineup || 'Todavía no cargada.'}</p>
          <p><strong>{match.away_team}:</strong> {match.away_lineup || 'Todavía no cargada.'}</p>
        </div>
        <div className="card flat">
          <h2>Tendencia</h2>
          <div className="prediction-summary">
            <div><strong>{summary.home}</strong><span>{match.home_team}</span></div>
            <div><strong>{summary.draw}</strong><span>Empate</span></div>
            <div><strong>{summary.away}</strong><span>{match.away_team}</span></div>
          </div>
        </div>
      </div>

      <div className="section table-wrap">
        <table>
          <thead><tr><th>Participante</th><th>Pronóstico</th><th>Actualizado</th></tr></thead>
          <tbody>
            {predictions.map(row => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td><strong>{match.home_team} {row.pred_home} - {row.pred_away} {match.away_team}</strong></td>
                <td>{new Date(row.updated_at).toLocaleString('es-UY')}</td>
              </tr>
            ))}
            {!predictions.length && <tr><td colSpan={3}>Todavía nadie cargó pronóstico para este partido.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
