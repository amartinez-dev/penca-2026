import Link from 'next/link';

export function Nav() {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="brand-mark"><img src="/salados-2026-logo.svg" alt="Penca Salados 2026" /></span>
        <span>
          <strong>Penca Salados 2026</strong>
          <small>Edición Mundial · Escuela de Música</small>
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
