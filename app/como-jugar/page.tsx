import Link from 'next/link';

export default function HowToPlayPage() {
  return (
    <section className="card how-page">
      <div className="eyebrow">Tutorial</div>
      <h1>Cómo jugar</h1>

      <div className="how-steps section">
        <article>
          <strong>1</strong>
          <h2>Entrá o registrate</h2>
          <p>Usá tu nombre y un PIN. Ese PIN te permite volver a entrar y modificar tus pronósticos antes del cierre.</p>
        </article>

        <article>
          <strong>2</strong>
          <h2>Elegí tus resultados</h2>
          <p>En cada partido ponés los goles del equipo de arriba y los goles del equipo de abajo.</p>
        </article>

        <article>
          <strong>3</strong>
          <h2>Cierre automático</h2>
          <p>Cada partido se bloquea 1 minuto antes de empezar. Después no se puede editar.</p>
        </article>

        <article>
          <strong>4</strong>
          <h2>Puntos</h2>
          <p>Marcador exacto: 5 puntos. Ganador o empate correcto: 2 puntos. Si no acertás, 0 puntos.</p>
        </article>

        <article>
          <strong>5</strong>
          <h2>Compará</h2>
          <p>En el detalle de cada partido podés ver los pronósticos de los demás participantes.</p>
        </article>

        <article>
          <strong>6</strong>
          <h2>Tabla</h2>
          <p>Cuando el admin carga un resultado real, la tabla se actualiza y recibís aviso si sumaste puntos.</p>
        </article>
      </div>

      <div className="actions">
        <Link className="button primary" href="/jugar">Ir a jugar</Link>
        <Link className="button secondary" href="/">Login</Link>
      </div>
    </section>
  );
}
