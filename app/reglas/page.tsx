export default function RulesPage() {
  return (
    <section className="card">
      <div className="eyebrow">Reglamento</div>
      <h1>Reglas de la penca</h1>
      <p>Usamos una regla simple: exacto vale mucho, acertar ganador o empate también suma, y no hay bonus por diferencia de goles.</p>

      <div className="grid three section">
        <div className="stat"><span>Marcador exacto</span><strong>5 pts</strong><p>Ejemplo: ponés 2-1 y termina 2-1.</p></div>
        <div className="stat"><span>Ganador o empate</span><strong>2 pts</strong><p>Ejemplo: ponés 1-0 y gana ese equipo, aunque no sea exacto.</p></div>
        <div className="stat"><span>Sin acierto</span><strong>0 pts</strong><p>Si no coincide ni ganador ni empate.</p></div>
      </div>

      <div className="section grid two">
        <div className="card flat">
          <h2>Cierre automático</h2>
          <p>Cada partido se cierra automáticamente 1 minuto antes de empezar. Después de eso no se puede crear ni editar el pronóstico.</p>
        </div>
        <div className="card flat">
          <h2>Eliminatorias y penales</h2>
          <p>La puntuación cuenta por el resultado del partido. Si una eliminatoria termina empatada y se define por penales, el empate es el resultado para la penca.</p>
          <p>El admin marca quién avanzó por penales solo para que la llave se actualice.</p>
        </div>
      </div>
    </section>
  );
}
