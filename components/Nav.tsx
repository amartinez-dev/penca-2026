'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type StoredParticipant = { id: string; name: string };

function getStoredParticipant(): StoredParticipant | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('pencaParticipant');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function Nav() {
  const [participant, setParticipant] = useState<StoredParticipant | null>(null);

  useEffect(() => {
    setParticipant(getStoredParticipant());
    const onStorage = () => setParticipant(getStoredParticipant());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function logout() {
    localStorage.removeItem('pencaParticipant');
    setParticipant(null);
    window.location.href = '/';
  }

  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="brand-mark"><img src="/salados-2026-logo.svg" alt="Penca Salados 2026" /></span>
        <span>
          <strong>Penca Salados 2026</strong>
          <small>{participant ? `Jugando: ${participant.name}` : 'Entrar · Registrarse · Admin'}</small>
        </span>
      </Link>
      <nav>
        <Link href="/">Inicio</Link>
        {participant && <Link href="/jugar">Jugar</Link>}
        {participant && <Link href="/tabla">Tabla</Link>}
        <Link href="/admin">Admin</Link>
        {participant && <button className="button secondary" style={{ minHeight: 'auto', padding: '.62rem .9rem' }} onClick={logout}>Salir</button>}
      </nav>
    </header>
  );
}
