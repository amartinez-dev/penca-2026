'use client';

import { useEffect, useState } from 'react';

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
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const participant = getStoredParticipant();
    if (participant) {
      window.location.href = '/jugar';
      return;
    }
    setChecked(true);
  }, []);

  async function login(formData: FormData) {
    setLoading(true);
    setError(null);
    const payload = Object.fromEntries(formData.entries());

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    setLoading(false);

    if (!json.ok) {
      setError(json.error || 'No se pudo entrar.');
      return;
    }

    saveParticipant(json.data.participant);
    window.location.href = '/jugar';
  }

  if (!checked) {
    return <section className="card"><div className="alert">Cargando...</div></section>;
  }

  return (
    <section className="simple-home">
      <div className="login-card card">
        <div className="eyebrow">Login</div>
        <h1>Entrar</h1>
        <p>Ingresá con tu nombre y PIN para jugar la penca.</p>

        <form action={login} className="form section">
          <label className="label">Nombre
            <input className="input" name="name" placeholder="Tu nombre" required />
          </label>
          <label className="label">PIN
            <input className="input" name="pin" type="password" inputMode="numeric" placeholder="Tu PIN" required />
          </label>
          {error && <div className="alert error">{error}</div>}
          <button disabled={loading} className="button primary" type="submit">
            {loading ? 'Entrando...' : 'Entrar a jugar'}
          </button>
        </form>

        <p className="help section">Para crear un usuario, abrí el menú ☰ y tocá Registrar.</p>
      </div>
    </section>
  );
}
