export default function RulesPage() {
  return (
    <section className="card">
      <div className="page-header compact-header">
        <div>
          <div className="eyebrow">Reglamento oficial de la penca</div>
          <h1>Reglas de juego</h1>
          <p>Todo pensado para que la experiencia sea clara, competitiva y fácil de seguir desde el celular.</p>
        </div>
      </div>

      <div className="grid two section">
        <div className="stat"><span>Puntaje exacto</span><strong>5 pts</strong><p>Si acertás el marcador exacto.</p></div>
        <div className="stat"><span>Ganador o empate</span><strong>3 pts</strong><p>Si acertás el resultado general del partido.</p></div>
        <div className="stat"><span>Diferencia correcta</span><strong>+1</strong><p>Bonus adicional por diferencia de goles.</p></div>
        <div className="stat"><span>Cierre automático</span><strong>1 min</strong><p>Antes del inicio de cada partido.</p></div>
      </div>

      <div className="grid two section">
        <article className="card flat">
          <h2>Fase eliminatoria</h2>
          <p>Los partidos de llaves futuras no aparecen hasta que estén definidas las dos selecciones reales. Cuando el admin carga resultados, la app actualiza automáticamente quién avanza.</p>
          <p>Si un partido eliminatorio termina empatado y un equipo avanza por penales, el admin puede indicarlo manualmente.</p>
        </article>
        <article className="card flat">
          <h2>Comparación entre participantes</h2>
          <p>En el detalle de cada partido podés ver qué pronóstico cargó cada participante. Esto facilita comparar elecciones, tendencias y resultados.</p>
          <p>El ranking general se recalcula cuando se cargan resultados manuales o cuando el admin toca “Recalcular”.</p>
        </article>
      </div>
    </section>
  );
}
