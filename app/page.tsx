'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Mode = 'login' | 'register';
type StoredParticipant = { id: string; name: string };

function saveParticipant(data: StoredParticipant) {
  localStorage.setItem('pencaParticipant', JSON.stringify(data));
}

function getStoredParticipant(): StoredParticipant | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('pencaParticipant');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export default function HomePage() {
  const [mode, setMode] = useState<Mode>('login');
  const [participant, setParticipant] = useState<StoredParticipant | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setParticipant(getStoredParticipant());
  }, []);

  async function submit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    setError(null);

    const payload = Object.fromEntries(formData.entries());
    const res = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    setLoading(false);

    if (!json.ok) {
      setError(json.error || 'No se pudo completar la acción.');
      return;
    }

    saveParticipant(json.data.participant);
    setParticipant(json.data.participant);
    window.location.href = '/jugar';
  }

  function logout() {
    localStorage.removeItem('pencaParticipant');
    setParticipant(null);
    setMessage('Sesión cerrada.');
  }

  if (participant) {
    return (
      <section className="start-grid">
        <div className="intro-panel">
          <p className="kicker">Participante</p>
          <h1>Hola, {participant.name}</h1>
          <p className="lead">Ya estás dentro de la penca. Desde acá podés cargar pronósticos, mirar la tabla y comparar lo que jugaron los demás en cada partido.</p>

          <div className="home-actions">
            <Link className="button primary" href="/jugar">Jugar</Link>
            <Link className="button" href="/tabla">Tabla</Link>
            <button className="button" type="button" onClick={logout}>Salir</button>
          </div>
        </div>

        <div className="side-panel">
          <h2>Regla simple</h2>
          <div className="rule-list">
            <div><strong>5</strong><span>Marcador exacto</span></div>
            <div><strong>2</strong><span>Ganador o empate</span></div>
            <div><strong>0</strong><span>Sin acierto</span></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="start-grid">
      <div className="intro-panel">
        <p className="kicker">Mundial 2026</p>
        <h1>Penca Salada 2026</h1>
        <p className="lead">Entrá, registrate o accedé al panel admin. Una vez adentro vas a poder jugar, mirar la tabla y comparar pronósticos por partido.</p>

        <div className="home-tabs" role="tablist" aria-label="Acceso">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">Entrar</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')} type="button">Registrarme</button>
          <Link href="/admin">Admin</Link>
        </div>
      </div>

      <div className="side-panel">
        <p className="kicker">{mode === 'login' ? 'Login' : 'Registro'}</p>
        <h2>{mode === 'login' ? 'Entrar a jugar' : 'Crear participante'}</h2>
        <p>{mode === 'login' ? 'Usá tu nombre y PIN.' : 'Al registrarte entrás automáticamente.'}</p>

        <form action={submit} className="form section">
          <label className="label">Nombre
            <input className="input" name="name" placeholder="Tu nombre" required />
          </label>
          <label className="label">PIN
            <input className="input" name="pin" type="password" inputMode="numeric" placeholder="4 a 8 números" required />
          </label>

          {message && <div className="alert success">{message}</div>}
          {error && <div className="alert error">{error}</div>}

          <button disabled={loading} className="button primary" type="submit">
            {loading ? 'Guardando...' : mode === 'register' ? 'Crear y entrar' : 'Entrar'}
          </button>
        </form>
      </div>
    </section>
  );
}
