'use client';

import { useEffect, useState } from 'react';
import type { LeaderboardRow } from '@/lib/types';

export default function TablePage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/leaderboard', { cache: 'no-store' });
    const json = await res.json();
    if (!json.ok) setError(json.error);
    else setRows(json.data || []);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const leader = rows[0];

  return (
    <section className="card">
      <div className="eyebrow">Ranking general</div>
      <h1>Tabla de posiciones</h1>
      <p>La tabla se actualiza cuando se cargan resultados. Los exactos y aciertos sirven para comparar rendimiento además de puntos.</p>

      <div className="grid three section">
        <div className="stat"><span>Participantes</span><strong>{rows.length}</strong></div>
        <div className="stat"><span>Puntero/a</span><strong style={{ fontSize: '1.35rem' }}>{leader?.name || '-'}</strong></div>
        <div className="stat"><span>Puntos arriba</span><strong>{leader?.points || 0}</strong></div>
      </div>

      {error && <div className="alert error section">{error}</div>}

      <div className="table-wrap section">
        <table>
          <thead><tr><th>#</th><th>Participante</th><th>Puntos</th><th>Exactos</th><th>Aciertos</th><th>Jugados</th></tr></thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.participant_id}>
                <td><span className="score-pill">{index + 1}</span></td>
                <td><strong>{row.name}</strong></td>
                <td><strong>{row.points}</strong></td>
                <td>{row.exactos}</td>
                <td>{row.aciertos}</td>
                <td>{row.jugados}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6}>Todavía no hay participantes con puntos.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
