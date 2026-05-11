export default function RulesPage() {
  return (
    <section className="card">
      <div className="eyebrow">Reglas</div>
      <h1>Cómo suma puntos la penca</h1>
      <div className="grid three section">
        <div className="stat"><strong>5</strong><span>Marcador exacto</span></div>
        <div className="stat"><strong>3</strong><span>Ganador o empate correcto</span></div>
        <div className="stat"><strong>+1</strong><span>Diferencia exacta, si también acertaste el resultado</span></div>
      </div>
      <div className="section table-wrap">
        <table>
          <thead><tr><th>Ejemplo</th><th>Resultado real</th><th>Puntos</th></tr></thead>
          <tbody>
            <tr><td>Uruguay 2 - 1 España</td><td>Uruguay 2 - 1 España</td><td>5</td></tr>
            <tr><td>Uruguay 1 - 0 España</td><td>Uruguay 2 - 1 España</td><td>3</td></tr>
            <tr><td>Uruguay 3 - 2 España</td><td>Uruguay 2 - 1 España</td><td>4</td></tr>
            <tr><td>España 1 - 0 Uruguay</td><td>Uruguay 2 - 1 España</td><td>0</td></tr>
          </tbody>
        </table>
      </div>
      <div className="section">
        <h2>Cierre de pronósticos</h2>
        <p>Los pronósticos se bloquean automáticamente 1 minuto antes del inicio de cada partido.</p>
        <h2>Llaves eliminatorias</h2>
        <p>Cuando el administrador carga resultados, la app recalcula la tabla y actualiza automáticamente los equipos clasificados en dieciseisavos, octavos, cuartos, semifinal, tercer puesto y final.</p>
        <h2>Comparación</h2>
        <p>En cada partido podés entrar a “Ver detalles y pronósticos de otros” para comparar qué puso cada participante.</p>
      </div>
    </section>
  );
}
