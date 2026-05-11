'use client';

import { useEffect, useState } from 'react';
import type { Match, Participant } from '@/lib/types';

type AdminTab = 'resumen' | 'partidos' | 'resultados' | 'participantes' | 'sync';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [savedPassword, setSavedPassword] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>('resumen');
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('pencaAdminPassword');
    if (stored) setSavedPassword(stored);
  }, []);

  async function adminFetch(url: string, options: RequestInit = {}) {
    const key = savedPassword || password;
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': key,
        ...(options.headers || {})
      }
    });
  }

  async function login() {
    localStorage.setItem('pencaAdminPassword', password);
    setSavedPassword(password);
    await loadAll(password);
  }

  async function loadAll(pass = savedPassword) {
    if (!pass) return;
    setError(null);
    const [matchesRes, participantsRes] = await Promise.all([
      fetch('/api/matches').then(r => r.json()),
      fetch('/api/admin/participants', { headers: { 'x-admin-password': pass } }).then(r => r.json())
    ]);
    if (matchesRes.ok) setMatches(matchesRes.data || []); else setError(matchesRes.error);
    if (participantsRes.ok) setParticipants(participantsRes.data || []); else setError(participantsRes.error);
  }

  useEffect(() => { loadAll(); }, [savedPassword]);

  async function addMatch(formData: FormData) {
    setMessage(null); setError(null);
    const payload = Object.fromEntries(formData.entries());
    const res = await adminFetch('/api/admin/matches', { method: 'POST', body: JSON.stringify(payload) });
    const json = await res.json();
    if (!json.ok) setError(json.error); else setMessage('Partido creado.');
    await loadAll();
  }

  async function saveResult(formData: FormData) {
    setMessage(null); setError(null);
    const payload = Object.fromEntries(formData.entries());
    const res = await adminFetch('/api/admin/result', { method: 'POST', body: JSON.stringify(payload) });
    const json = await res.json();
    if (!json.ok) setError(json.error); else setMessage(`Resultado guardado, tabla recalculada y ${json.data?.progression?.updated || 0} partidos futuros actualizados.`);
    await loadAll();
  }

  async function saveMatchInfo(formData: FormData) {
    setMessage(null); setError(null);
    const payload = Object.fromEntries(formData.entries());
    const res = await adminFetch('/api/admin/match-info', { method: 'POST', body: JSON.stringify(payload) });
    const json = await res.json();
    if (!json.ok) setError(json.error); else setMessage('Información del partido guardada.');
    await loadAll();
  }

  async function syncFootball() {
    setMessage(null); setError(null);
    const res = await adminFetch('/api/admin/sync-api-football', { method: 'POST', body: JSON.stringify({}) });
    const json = await res.json();
    if (!json.ok) setError(json.error); else setMessage(`Sincronización lista: ${json.data.upserted} partidos actualizados, ${json.data.recalculated} puntajes recalculados.`);
    await loadAll();
  }

  async function recalculate() {
    setMessage(null); setError(null);
    const res = await adminFetch('/api/admin/recalculate', { method: 'POST', body: JSON.stringify({}) });
    const json = await res.json();
    if (!json.ok) setError(json.error); else setMessage(`Tabla recalculada: ${json.data.recalculated} puntajes. Llave actualizada: ${json.data?.progression?.updated || 0} partidos.`);
  }

  if (!savedPassword) {
    return (
      <section className="card">
        <div className="eyebrow">Panel admin</div>
        <h1>Entrar como administrador</h1>
        <p>Usá la clave que configuraste en la variable <code>ADMIN_PASSWORD</code>.</p>
        <div className="form" style={{ maxWidth: 440 }}>
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Clave admin" />
          <button className="button" onClick={login}>Entrar</button>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="eyebrow">Panel admin</div>
      <h1>Administración</h1>
      <div className="actions">
        {(['resumen', 'partidos', 'resultados', 'participantes', 'sync'] as AdminTab[]).map(item => (
          <button key={item} className={`button ${tab === item ? '' : 'secondary'}`} onClick={() => setTab(item)}>{item}</button>
        ))}
        <button className="button danger" onClick={() => { localStorage.removeItem('pencaAdminPassword'); setSavedPassword(null); }}>Salir</button>
      </div>
      {message && <div className="alert success section">{message}</div>}
      {error && <div className="alert error section">{error}</div>}

      {tab === 'resumen' && (
        <div className="grid three section">
          <div className="stat"><span>Participantes</span><strong>{participants.length}</strong></div>
          <div className="stat"><span>Partidos</span><strong>{matches.length}</strong></div>
          <div className="stat"><span>Finalizados</span><strong>{matches.filter(m => m.status === 'finished').length}</strong></div>
        </div>
      )}

      {tab === 'partidos' && (
        <div className="grid two section">
          <form action={addMatch} className="card flat form">
            <h2>Crear partido manual</h2>
            <label className="label">Número de partido<input className="input" name="tournament_match_no" inputMode="numeric" /></label>
            <label className="label">Fase<input className="input" name="stage" defaultValue="Grupo" /></label>
            <label className="label">Grupo<input className="input" name="group_name" placeholder="Grupo A" /></label>
            <label className="label">Local<input className="input" name="home_team" required /></label>
            <label className="label">Visitante<input className="input" name="away_team" required /></label>
            <label className="label">Fecha y hora<input className="input" name="kickoff_at" type="datetime-local" required /></label>
            <label className="label">Estadio<input className="input" name="venue" /></label>
            <label className="label">Ciudad<input className="input" name="city" /></label>
            <button className="button warn" type="submit">Crear partido</button>
          </form>
          <div className="card flat">
            <h2>Editar información</h2>
            <p>Acá podés agregar estadio, ciudad, notas y alineaciones. Eso se ve en el detalle del partido.</p>
          </div>
          <div className="table-wrap" style={{ gridColumn: '1 / -1' }}>
            <table>
              <thead><tr><th>Partido</th><th>Estadio / ciudad</th><th>Notas y alineaciones</th><th></th></tr></thead>
              <tbody>{matches.map(m => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.tournament_match_no ? `#${m.tournament_match_no} · ` : ''}{m.home_team} vs {m.away_team}</strong><br />
                    <span className="help">{new Date(m.kickoff_at).toLocaleString('es-UY')} · {m.stage}{m.group_name ? ` · ${m.group_name}` : ''}</span>
                  </td>
                  <td>
                    <form id={`info-${m.id}`} action={saveMatchInfo} className="form">
                      <input type="hidden" name="match_id" value={m.id} />
                      <input className="input" name="venue" placeholder="Estadio" defaultValue={m.venue || ''} />
                      <input className="input" name="city" placeholder="Ciudad" defaultValue={m.city || ''} />
                    </form>
                  </td>
                  <td>
                    <textarea className="input" name="notes" placeholder="Notas" defaultValue={m.notes || ''} form={`info-${m.id}`} rows={2} />
                    <textarea className="input" name="home_lineup" placeholder={`Alineación ${m.home_team}`} defaultValue={m.home_lineup || ''} form={`info-${m.id}`} rows={2} />
                    <textarea className="input" name="away_lineup" placeholder={`Alineación ${m.away_team}`} defaultValue={m.away_lineup || ''} form={`info-${m.id}`} rows={2} />
                  </td>
                  <td><button className="button secondary" form={`info-${m.id}`}>Guardar info</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'resultados' && (
        <div className="section table-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Partido</th><th>Resultado manual</th><th></th></tr></thead>
            <tbody>
              {matches.map(match => (
                <tr key={match.id}>
                  <td>{new Date(match.kickoff_at).toLocaleString('es-UY')}</td>
                  <td>{match.home_team} vs {match.away_team}<br /><span className="help">Actual: {match.home_score === null ? '-' : `${match.home_score} - ${match.away_score}`} · {match.status}{match.winner_team ? ` · avanza ${match.winner_team}` : ''}</span></td>
                  <td>
                    <form id={`result-${match.id}`} action={saveResult} className="score-inputs">
                      <input type="hidden" name="match_id" value={match.id} />
                      <input className="input" name="home_score" inputMode="numeric" required />
                      <span>-</span>
                      <input className="input" name="away_score" inputMode="numeric" required />
                      <select className="select" name="winner_team" title="Ganador por penales si corresponde" style={{ gridColumn: '1 / 4' }}>
                        <option value="">Ganador por penales si empatan</option>
                        <option value={match.home_team}>{match.home_team}</option>
                        <option value={match.away_team}>{match.away_team}</option>
                      </select>
                    </form>
                  </td>
                  <td><button className="button secondary" form={`result-${match.id}`}>Guardar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'participantes' && (
        <div className="section table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Alta</th></tr></thead>
            <tbody>{participants.map(p => <tr key={p.id}><td>{p.name}</td><td>{new Date(p.created_at).toLocaleString('es-UY')}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {tab === 'sync' && (
        <div className="grid two section">
          <div className="card flat">
            <h2>Sincronización externa</h2>
            <p>Opcional. La penca puede funcionar 100% manual. Si usás una fuente externa, este botón intenta sincronizar datos.</p>
            <button className="button warn" onClick={syncFootball}>Sincronizar ahora</button>
          </div>
          <div className="card flat">
            <h2>Recalcular tabla</h2>
            <p>Vuelve a calcular todos los puntajes de partidos finalizados. Útil si cambiaste resultados manualmente.</p>
            <button className="button" onClick={recalculate}>Recalcular</button>
          </div>
        </div>
      )}
    </section>
  );
}
