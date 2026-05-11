import Link from 'next/link';

export function Nav() {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="brand-mark">S</span>
        <span>
          <strong>Penca Salados</strong>
          <small>Mundial 2026</small>
        </span>
      </Link>
      <nav>
        <Link href="/jugar">Jugar</Link>
        <Link href="/tabla">Tabla</Link>
        <Link href="/reglas">Reglas</Link>
        <Link href="/admin">Admin</Link>
      </nav>
    </header>
  );
}
