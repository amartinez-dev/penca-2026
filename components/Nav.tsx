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
    const timer = setInterval(() => setParticipant(getStoredParticipant()), 1500);
    return () => clearInterval(timer);
  }, []);

  function logout() {
    localStorage.removeItem('pencaParticipant');
    setParticipant(null);
    window.location.href = '/';
  }

  return (
    <header className="topbar">
      <Link className="brand-text" href="/" aria-label="Inicio">
        Penca Salada 2026
      </Link>

      <nav className="main-nav">
        <Link href="/">Inicio</Link>
        {participant && <Link href="/jugar">Jugar</Link>}
        {participant && <Link href="/tabla">Tabla</Link>}
        <Link href="/admin">Admin</Link>
        {participant && <button type="button" onClick={logout}>Salir</button>}
      </nav>
    </header>
  );
}
