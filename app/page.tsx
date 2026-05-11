'use client';

import Link from 'next/link';
import { useState } from 'react';

type Mode = 'login' | 'register';

function saveParticipant(data: { id: string; name: string }) {
  localStorage.setItem('pencaParticipant', JSON.stringify(data));
}

export default function HomePage() {
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setMessage(mode === 'register' ? 'Registro completo. Ya podés jugar.' : 'Entrada correcta.');
    window.location.href = '/jugar';
  }

  return (
    <div className="hero">
      <section className="card">
        <div className="eyebrow">Escuela de Música Salados</div>
        <h1>La penca del Mundial 2026</h1>
        <p>
          Pronosticá los partidos, cargá tus resultados cuando quieras y seguí la tabla general en vivo.
        </p>
        <div className="actions">
          <Link href="/jugar" className="button">Ir a jugar</Link>
          <Link href="/tabla" className="button secondary">Ver tabla</Link>
        </div>
      </section>

      <section className="card">
        <div className="actions" style={{ marginTop: 0 }}>
          <button className={`button ${mode === 'login' ? '' : 'secondary'}`} onClick={() => setMode('login')}>Entrar</button>
          <button className={`button ${mode === 'register' ? '' : 'secondary'}`} onClick={() => setMode('register')}>Registrarme</button>
        </div>

        <form action={submit} className="form section">
          <label className="label">Nombre
            <input className="input" name="name" placeholder="Tu nombre" required />
            <span className="help">Usá un nombre que después puedas recordar. Si hay otro igual, agregá apellido o apodo.</span>
          </label>
          <label className="label">PIN
            <input className="input" name="pin" type="password" inputMode="numeric" placeholder="4 a 8 números" required />
            <span className="help">Este PIN sirve para que nadie edite tus pronósticos.</span>
          </label>
          {message && <div className="alert success">{message}</div>}
          {error && <div className="alert error">{error}</div>}
          <button disabled={loading} className="button warn" type="submit">
            {loading ? 'Guardando...' : mode === 'register' ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>
      </section>
    </div>
  );
}
