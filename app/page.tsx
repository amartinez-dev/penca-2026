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
    setMessage(mode === 'register' ? 'Registro completo. Entraste automáticamente.' : 'Entrada correcta.');
    window.location.href = '/jugar';
  }

  function logout() {
    localStorage.removeItem('pencaParticipant');
    setParticipant(null);
    setMessage('Sesión cerrada.');
  }

  if (participant) {
    return (
      <section className="card hero-card hero-card-pro">
        <div className="hero-orb hero-orb-a" />
        <div className="hero-orb hero-orb-b" />
        <div className="hero-gridline" />
        <div>
          <img className="hero-logo" src="/salados-2026-logo.svg" alt="Penca Salados 2026" />
          <div className="eyebrow section">Ya estás dentro</div>
          <h1>Hola, {participant.name}</h1>
          <p>Ya podés jugar, mirar la tabla y comparar pronósticos entrando al detalle de cada partido.</p>
          <div className="actions">
            <Link href="/jugar" className="button warn">Jugar</Link>
            <Link href="/tabla" className="button secondary">Tabla de posiciones</Link>
            <button className="button secondary" onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="hero hero-home">
      <section className="card hero-card hero-card-pro">
        <div className="hero-orb hero-orb-a" />
        <div className="hero-orb hero-orb-b" />
        <div className="hero-gridline" />
        <div>
          <img className="hero-logo" src="/salados-2026-logo.svg" alt="Penca Salados 2026" />
          <div className="eyebrow section">Inicio</div>
          <h1>Entrar, registrarse o administrar.</h1>
          <p>La penca se habilita al entrar con nombre y PIN. Después aparecen Jugar, Tabla y los detalles por partido.</p>
        </div>
        <div className="actions">
          <button className={`button ${mode === 'login' ? 'warn' : 'secondary'}`} onClick={() => setMode('login')}>Entrar</button>
          <button className={`button ${mode === 'register' ? 'warn' : 'secondary'}`} onClick={() => setMode('register')}>Registrarme</button>
          <Link href="/admin" className="button secondary">Admin</Link>
        </div>
      </section>

      <section className="card auth-panel">
        <div className="eyebrow">{mode === 'login' ? 'Login participante' : 'Registro participante'}</div>
        <h2>{mode === 'login' ? 'Entrá con tu nombre y PIN' : 'Crear cuenta'}</h2>
        <p>{mode === 'login' ? 'Usá el mismo nombre y PIN con el que te registraste.' : 'Al registrarte quedás logueado automáticamente y vas directo a Jugar.'}</p>

        <div className="mode-switch section">
          <button className={`segmented ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Entrar</button>
          <button className={`segmented ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Registrarme</button>
        </div>

        <form action={submit} className="form section">
          <label className="label">Nombre
            <input className="input" name="name" placeholder="Tu nombre" required />
            <span className="help">Si hay otro igual, agregá apellido o apodo.</span>
          </label>
          <label className="label">PIN
            <input className="input" name="pin" type="password" inputMode="numeric" placeholder="4 a 8 números" required />
            <span className="help">Guardalo para poder volver a entrar.</span>
          </label>
          {message && <div className="alert success">{message}</div>}
          {error && <div className="alert error">{error}</div>}
          <button disabled={loading} className="button warn" type="submit">
            {loading ? 'Guardando...' : mode === 'register' ? 'Crear y entrar' : 'Entrar'}
          </button>
        </form>
      </section>
    </div>
  );
}
