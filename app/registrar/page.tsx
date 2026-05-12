'use client';

import Link from 'next/link';
import { useState } from 'react';

type StoredParticipant = { id: string; name: string };

function saveParticipant(data: StoredParticipant) {
  localStorage.setItem('pencaParticipant', JSON.stringify(data));
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function register(formData: FormData) {
    setLoading(true);
    setError(null);
    const payload = Object.fromEntries(formData.entries());

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    setLoading(false);

    if (!json.ok) {
      setError(json.error || 'No se pudo crear el usuario.');
      return;
    }

    saveParticipant(json.data.participant);
    window.location.href = '/jugar';
  }

  return (
    <section className="simple-home">
      <div className="login-card card">
        <div className="eyebrow">Registro</div>
        <h1>Registrar</h1>
        <p>Creá tu participante. Al terminar entrás automáticamente.</p>

        <form action={register} className="form section">
          <label className="label">Nombre
            <input className="input" name="name" placeholder="Tu nombre" required />
            <span className="help">Si hay otro nombre igual, agregá apellido o apodo.</span>
          </label>
          <label className="label">PIN
            <input className="input" name="pin" type="password" inputMode="numeric" placeholder="4 a 8 números" required />
            <span className="help">Guardalo para volver a entrar.</span>
          </label>
          {error && <div className="alert error">{error}</div>}
          <button disabled={loading} className="button primary" type="submit">
            {loading ? 'Creando...' : 'Crear y entrar'}
          </button>
        </form>

        <Link href="/" className="button secondary section">Volver al login</Link>
      </div>
    </section>
  );
}
