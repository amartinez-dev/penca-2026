'use client';

import { useEffect, useState } from 'react';
import type { LeaderboardRow } from '@/lib/types';

type StoredParticipant = { id: string; name: string };

function getStoredParticipant(): StoredParticipant | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('pencaParticipant');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export default function TablePage() {
  const [participant, setParticipant] = useState<StoredParticipant | null>(null);
  const [checked, setChecked] = useState(false);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const stored = getStoredParticipant();
    setParticipant(stored);
    setChecked(true);
    if (!stored) return;

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

  if (checked && !participant) {
    return (
      <section className="card">
        <div className="eyebrow">Tabla</div>
        <h1>Entrá para ver la tabla</h1>
        <p>Primero ingresá con tu nombre y PIN.</p>
        <a className="button primary section" href="/">Ir al login</a>
      </section>
    );
  }

  return (
    <section className="card ranking-page">
      <div className="eyebrow">Ranking general</div>
      <h1>Tabla de posiciones</h1>
      <p>Regla actual: exacto 5 puntos, ganador o empate 2 puntos.</p>

      {error && <div className="alert error section">{error}</div>}

      <div className="table-wrap section compact-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Participante</th>
              <th>Puntos</th>
              <th>Exactos</th>
              <th>Aciertos</th>
              <th>Jugados</th>
            </tr>
          </thead>
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
