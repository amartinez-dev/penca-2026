'use client';

import { useEffect, useState } from 'react';
import type { Match, Participant } from '@/lib/types';

type AdminTab = 'resumen' | 'partidos' | 'resultados' | 'participantes' | 'sync';

const tabs: { key: AdminTab; label: string }[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'partidos', label: 'Partidos' },
  { key: 'resultados', label: 'Resultados' },
  { key: 'participantes', label: 'Participantes' },
  { key: 'sync', label: 'Sync' }
];

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [savedPassword, setSavedPassword] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>('resumen');
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('pencaAdminPassword');
    if (stored) setSavedPassword(stored);

    const params = new URLSearchParams(window.location.search);
    const requested = params.get('tab') as AdminTab | null;
    if (requested && tabs.some(item => item.key === requested)) setTab(requested);
  }, []);

  function changeTab(next: AdminTab) {
    setTab(next);
    setAdminMenuOpen(false);
    window.history.replaceState(null, '', `/admin?tab=${next}`);
  }

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

  function logout() {
    localStorage.removeItem('pencaAdminPassword');
    setSavedPassword(null);
    setPassword('');
    window.location.href = '/admin';
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

  async function updateMatch(formData: FormData) {
    setMessage(null); setError(null);
    const payload = Object.fromEntries(formData.entries());
    const res = await adminFetch('/api/admin/matches', { method: 'PATCH', body: JSON.stringify(payload) });
    const json = await res.json();
    if (!json.ok) setError(json.error); else setMessage('Partido modificado.');
    await loadAll();
  }

  async function saveResult(formData: FormData) {
    setMessage(null); setError(null);
    const payload = Object.fromEntries(formData.entries());
    const res = await adminFetch('/api/admin/result', { method: 'POST', body: JSON.stringify(payload) });
    const json = await res.json();
    if (!json.ok) setError(json.error); else setMessage(`Resultado guardado. Llave actualizada: ${json.data?.progression?.updated || 0} partidos.`);
    await loadAll();
  }

  async function deleteParticipant(participantId: string, name: string) {
    const ok = window.confirm(`¿Quitar a ${name}? Se borran sus pronósticos, puntos y notificaciones.`);
    if (!ok) return;

    setMessage(null); setError(null);
    const res = await adminFetch('/api/admin/participants', { method: 'DELETE', body: JSON.stringify({ participant_id: participantId }) });
    const json = await res.json();
    if (!json.ok) setError(json.error); else setMessage(`Participante quitado: ${name}.`);
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
      <section className="card admin-login-card">
        <div className="eyebrow">Admin</div>
        <form className="form section" action={login}>
          <label className="label">Clave
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Clave admin" />
          </label>
          <button className="button primary" type="submit">Entrar</button>
        </form>
      </section>
    );
  }

  return (
    <section className="card admin-page">
      <div className="admin-head">
        <div>
          <div className="eyebrow">Admin</div>
          <h1>{tabs.find(item => item.key === tab)?.label || 'Admin'}</h1>
        </div>
        <button className="menu-toggle admin-menu-button" aria-label="Menú admin" onClick={() => setAdminMenuOpen(prev => !prev)}>
          <span /><span /><span />
        </button>
      </div>

      {adminMenuOpen && (
        <div className="admin-menu-panel">
          {tabs.map(item => (
            <button key={item.key} className={tab === item.key ? 'active' : ''} onClick={() => changeTab(item.key)}>{item.label}</button>
          ))}
          <button onClick={logout}>Salir</button>
        </div>
      )}

      {message && <div className="alert success section">{message}</div>}
      {error && <div className="alert error section">{error}</div>}

      {tab === 'resumen' && (
        <div className="admin-summary section">
          <div className="stat"><span>Participantes</span><strong>{participants.length}</strong></div>
          <div className="stat"><span>Partidos</span><strong>{matches.length}</strong></div>
          <div className="stat"><span>Finalizados</span><strong>{matches.filter(m => m.status === 'finished').length}</strong></div>
        </div>
      )}

      {tab === 'partidos' && (
        <div className="section">
          <form action={addMatch} className="card flat form admin-form">
            <div className="section-title">Crear partido</div>
            <label className="label">Número<input className="input" name="tournament_match_no" inputMode="numeric" /></label>
            <label className="label">Fase<input className="input" name="stage" defaultValue="Grupo" /></label>
            <label className="label">Grupo<input className="input" name="group_name" placeholder="Grupo A" /></label>
            <label className="label">Local<input className="input" name="home_team" required /></label>
            <label className="label">Visitante<input className="input" name="away_team" required /></label>
            <label className="label">Fecha y hora<input className="input" name="kickoff_at" type="datetime-local" required /></label>
            <label className="label">Estadio<input className="input" name="venue" /></label>
            <label className="label">Ciudad<input className="input" name="city" /></label>
            <button className="button primary" type="submit">Crear partido</button>
          </form>

          <div className="admin-match-list section">
            {matches.map(match => (
              <form key={match.id} action={updateMatch} className="card flat form admin-edit-match">
                <input type="hidden" name="match_id" value={match.id} />
                <div className="section-title">{match.tournament_match_no ? `#${match.tournament_match_no}` : 'Partido'} · {match.home_team} vs {match.away_team}</div>

                <div className="grid two">
                  <label className="label">Número<input className="input" name="tournament_match_no" defaultValue={match.tournament_match_no || ''} /></label>
                  <label className="label">Estado
                    <select className="select" name="status" defaultValue={match.status}>
                      <option value="not_started">Pendiente</option>
                      <option value="live">En vivo</option>
                      <option value="finished">Finalizado</option>
                      <option value="postponed">Postergado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </label>
                </div>

                <div className="grid two">
                  <label className="label">Fase<input className="input" name="stage" defaultValue={match.stage} /></label>
                  <label className="label">Grupo<input className="input" name="group_name" defaultValue={match.group_name || ''} /></label>
                </div>

                <div className="grid two">
                  <label className="label">Local<input className="input" name="home_team" defaultValue={match.home_team} /></label>
                  <label className="label">Visitante<input className="input" name="away_team" defaultValue={match.away_team} /></label>
                </div>

                <div className="grid two">
                  <label className="label">Casillero local<input className="input" name="home_source" defaultValue={match.home_source || ''} /></label>
                  <label className="label">Casillero visitante<input className="input" name="away_source" defaultValue={match.away_source || ''} /></label>
                </div>

                <label className="label">Fecha y hora<input className="input" name="kickoff_at" type="datetime-local" defaultValue={toDatetimeLocal(match.kickoff_at)} /></label>

                <div className="grid two">
                  <label className="label">Estadio<input className="input" name="venue" defaultValue={match.venue || ''} /></label>
                  <label className="label">Ciudad<input className="input" name="city" defaultValue={match.city || ''} /></label>
                </div>

                <label className="label">Notas<textarea className="input" name="notes" defaultValue={match.notes || ''} rows={2} /></label>
                <label className="label">Alineación local<textarea className="input" name="home_lineup" defaultValue={match.home_lineup || ''} rows={2} /></label>
                <label className="label">Alineación visitante<textarea className="input" name="away_lineup" defaultValue={match.away_lineup || ''} rows={2} /></label>

                <button className="button primary" type="submit">Guardar cambios</button>
              </form>
            ))}
          </div>
        </div>
      )}

      {tab === 'resultados' && (
        <div className="section admin-result-list">
          {matches.map(match => (
            <form key={match.id} action={saveResult} className="card flat result-card">
              <input type="hidden" name="match_id" value={match.id} />
              <strong>{match.home_team} vs {match.away_team}</strong>
              <span className="help">{new Date(match.kickoff_at).toLocaleString('es-UY')} · Actual: {match.home_score === null ? '-' : `${match.home_score} - ${match.away_score}`}</span>
              <div className="score-inputs section">
                <input className="input" name="home_score" inputMode="numeric" required />
                <span>-</span>
                <input className="input" name="away_score" inputMode="numeric" required />
                <select className="select" name="winner_team" title="Ganador por penales si corresponde" style={{ gridColumn: '1 / 4' }}>
                  <option value="">Ganador por penales si empatan</option>
                  <option value={match.home_team}>{match.home_team}</option>
                  <option value={match.away_team}>{match.away_team}</option>
                </select>
              </div>
              <button className="button primary" type="submit">Guardar resultado</button>
            </form>
          ))}
        </div>
      )}

      {tab === 'participantes' && (
        <div className="section table-wrap compact-table">
          <table>
            <thead><tr><th>Nombre</th><th>Alta</th><th></th></tr></thead>
            <tbody>
              {participants.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td>{new Date(p.created_at).toLocaleString('es-UY')}</td>
                  <td><button className="button danger" onClick={() => deleteParticipant(p.id, p.name)}>Quitar</button></td>
                </tr>
              ))}
              {!participants.length && <tr><td colSpan={3}>No hay participantes.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'sync' && (
        <div className="grid two section">
          <div className="card flat">
            <div className="section-title">Sincronización</div>
            <p>Opcional. La penca puede funcionar 100% manual.</p>
            <button className="button primary section" onClick={syncFootball}>Sincronizar ahora</button>
          </div>
          <div className="card flat">
            <div className="section-title">Recalcular</div>
            <p>Vuelve a calcular todos los puntajes con la regla actual.</p>
            <button className="button primary section" onClick={recalculate}>Recalcular tabla</button>
          </div>
        </div>
      )}
    </section>
  );
}
