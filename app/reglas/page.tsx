export default function RulesPage() {
  return (
    <section className="card">
      <div className="eyebrow">Reglamento</div>
      <h1>Reglas de la penca</h1>
      <div className="grid two section">
        <div className="stat"><strong>5</strong><span>puntos por marcador exacto.</span></div>
        <div className="stat"><strong>3</strong><span>puntos por acertar ganador o empate.</span></div>
        <div className="stat"><strong>+1</strong><span>extra por diferencia de goles correcta.</span></div>
        <div className="stat"><strong>1 min</strong><span>antes del inicio se cierra cada partido automáticamente.</span></div>
      </div>
      <div className="section grid two">
        <div className="card flat">
          <h2>Llaves eliminatorias</h2>
          <p>Los partidos de dieciseisavos en adelante no aparecen para pronosticar hasta que estén definidas las dos selecciones.</p>
          <p>Cuando el admin carga los resultados reales, la app actualiza automáticamente quién avanza a la siguiente ronda.</p>
        </div>
        <div className="card flat">
          <h2>Comparación</h2>
          <p>En cada partido podés entrar a detalles para ver estadio, ciudad, notas, alineaciones y los pronósticos que cargaron los demás participantes.</p>
        </div>
      </div>
    </section>
  );
}
