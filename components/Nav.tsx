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

function hasAdminSession() {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem('pencaAdminPassword'));
}

export function Nav() {
  const [participant, setParticipant] = useState<StoredParticipant | null>(null);
  const [admin, setAdmin] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setParticipant(getStoredParticipant());
      setAdmin(hasAdminSession());
    };
    refresh();
    const timer = setInterval(refresh, 800);
    return () => clearInterval(timer);
  }, []);

  function closeMenu() {
    setOpen(false);
  }

  function logoutParticipant() {
    localStorage.removeItem('pencaParticipant');
    setParticipant(null);
    setOpen(false);
    window.location.href = '/';
  }

  function logoutAdmin() {
    localStorage.removeItem('pencaAdminPassword');
    setAdmin(false);
    setOpen(false);
    window.location.href = '/admin';
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
        {!participant && !admin && <Link href="/registrar" onClick={closeMenu}>Registrar</Link>}
        {!participant && !admin && <Link href="/como-jugar" onClick={closeMenu}>Cómo jugar</Link>}
        {!participant && !admin && <Link href="/admin" onClick={closeMenu}>Admin</Link>}

        {participant && <Link href="/jugar" onClick={closeMenu}>Jugar</Link>}
        {participant && <Link href="/tabla" onClick={closeMenu}>Tabla</Link>}
        {participant && <Link href="/como-jugar" onClick={closeMenu}>Cómo jugar</Link>}
        {participant && <button type="button" onClick={logoutParticipant}>Salir</button>}

        {admin && !participant && <Link href="/admin" onClick={closeMenu}>Admin</Link>}
        {admin && !participant && <Link href="/como-jugar" onClick={closeMenu}>Cómo jugar</Link>}
        {admin && !participant && <button type="button" onClick={logoutAdmin}>Salir admin</button>}
      </nav>
    </header>
  );
}
