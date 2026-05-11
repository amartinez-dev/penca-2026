'use client';

import { use, useEffect, useState } from 'react';
import { TeamBadge } from '@/components/TeamBadge';
import { isMatchResolved } from '@/lib/teamAssets';
import type { Match, MatchPredictionRow } from '@/lib/types';

function statusLabel(status: string) {
  if (status === 'finished') return 'Finalizado';
  if (status === 'live') return 'En vivo';
  if (status === 'not_started') return 'Pendiente';
  if (status === 'postponed') return 'Postergado';
  return status;
}

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [match, setMatch] = useState<Match | null>(null);
  const [predictions, setPredictions] = useState<MatchPredictionRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load(matchId: string) {
    setError(null);
    const [matchRes, predRes] = await Promise.all([
      fetch(`/api/matches/${matchId}`, { cache: 'no-store' }).then(r => r.json()),
      fetch(`/api/matches/${matchId}/predictions`, { cache: 'no-store' }).then(r => r.json())
    ]);

    if (!matchRes.ok) setError(matchRes.error || 'No se pudo cargar el partido.');
    else setMatch(matchRes.data);

    if (!predRes.ok) setError(predRes.error || 'No se pudieron cargar los pronósticos.');
    else setPredictions(predRes.data || []);
  }

  useEffect(() => {
    load(id);
    const interval = setInterval(() => load(id), 30000);
    return () => clearInterval(interval);
  }, [id]);

  if (error) return <section className="card"><div className="alert error">{error}</div></section>;
  if (!match) return <section className="card"><div className="alert">Cargando partido...</div></section>;

  const resolved = isMatchResolved(match);

  return (
    <section className="card">
      <div className="eyebrow">Detalle del partido</div>
      <div className="match-card section">
        <div className="match-team"><TeamBadge team={match.home_team} size="lg" /></div>
        <div className="match-vs">
          <div>VS</div>
          <div className="score-pill section">{match.home_score === null ? '-' : `${match.home_score} - ${match.away_score}`}</div>
        </div>
        <div className="match-team away"><TeamBadge team={match.away_team} size="lg" /></div>
      </div>

      <p>
        {new Date(match.kickoff_at).toLocaleString('es-UY', { dateStyle: 'full', timeStyle: 'short' })} · {match.stage}{match.group_name ? ` · ${match.group_name}` : ''}
      </p>
      {!resolved && <div className="alert section">Este partido todavía no acepta pronósticos porque falta definir al menos una selección.</div>}

      <div className="grid three section">
        <div className="stat"><span>Estado</span><strong style={{ fontSize: '1.25rem' }}>{statusLabel(match.status)}</strong></div>
        <div className="stat"><span>Resultado</span><strong>{match.home_score === null ? '-' : `${match.home_score} - ${match.away_score}`}</strong></div>
        <div className="stat"><span>Estadio</span><strong style={{ fontSize: '1.15rem' }}>{match.venue || 'A confirmar'}</strong><span>{match.city || ''}</span></div>
      </div>

      <div className="grid two section">
        <div className="card flat">
          <h2>Información</h2>
          <p><strong>Casillero original:</strong> {match.home_source || match.home_team} vs {match.away_source || match.away_team}</p>
          <p>{match.notes || 'Sin notas adicionales por ahora.'}</p>
        </div>
        <div className="card flat">
          <h2>Alineaciones</h2>
          <p><strong>{match.home_team}:</strong> {match.home_lineup || 'Todavía no cargada.'}</p>
          <p><strong>{match.away_team}:</strong> {match.away_lineup || 'Todavía no cargada.'}</p>
        </div>
      </div>

      <div className="section table-wrap">
        <table>
          <thead><tr><th>Participante</th><th>Pronóstico</th><th>Actualizado</th></tr></thead>
          <tbody>
            {predictions.map(row => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td><strong>{row.pred_home} - {row.pred_away}</strong></td>
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
