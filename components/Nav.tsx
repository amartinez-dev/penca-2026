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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setParticipant(getStoredParticipant());
    const timer = setInterval(() => setParticipant(getStoredParticipant()), 1000);
    return () => clearInterval(timer);
  }, []);

  function closeMenu() {
    setOpen(false);
  }

  function logout() {
    localStorage.removeItem('pencaParticipant');
    setParticipant(null);
    setOpen(false);
    window.location.href = '/';
  }

  return (
    <header className="topbar compact-topbar">
      <Link className="brand-text" href={participant ? '/jugar' : '/'} aria-label="Penca Salada 2026" onClick={closeMenu}>
        Penca Salada 2026
      </Link>

      <button
        type="button"
        className="menu-toggle"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && <button className="menu-backdrop" aria-label="Cerrar menú" onClick={closeMenu} />}

      <nav className={`main-nav drawer-nav ${open ? 'open' : ''}`}>
        {!participant && <Link href="/registrar" onClick={closeMenu}>Registrar</Link>}
        {!participant && <Link href="/admin" onClick={closeMenu}>Admin</Link>}

        {participant && <Link href="/jugar" onClick={closeMenu}>Jugar</Link>}
        {participant && <Link href="/tabla" onClick={closeMenu}>Tabla</Link>}
        {participant && <button type="button" onClick={logout}>Salir</button>}
      </nav>
    </header>
  );
}
