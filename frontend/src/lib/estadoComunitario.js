const UMBRAL_PROGRESO = 2;
const UMBRAL_RESOLUCION = 3;

/**
 * Texto orientativo sobre qué falta para el siguiente estado comunitario.
 * Umbrales alineados con vista_denuncias (SQL).
 */
export function mensajeProximoEstado({
  estado,
  total_progreso_si = 0,
  total_progreso_no = 0,
  total_resoluciones = 0,
}) {
  if (estado === 'resuelta') return null;

  const partes = [];
  const faltanResolucion = Math.max(0, UMBRAL_RESOLUCION - total_resoluciones);

  if (faltanResolucion > 0) {
    partes.push(
      `Faltan ${faltanResolucion} confirmación${faltanResolucion !== 1 ? 'es' : ''} de resolución de otros ciudadanos para RESUELTA`
    );
  }

  if (estado === 'activa') {
    const faltanSi = Math.max(0, UMBRAL_PROGRESO - total_progreso_si);
    if (faltanSi > 0) {
      partes.push(
        `Faltan ${faltanSi} voto${faltanSi !== 1 ? 's' : ''} «Sí progresa» para CON AVANCE`
      );
    } else if (total_progreso_si <= total_progreso_no) {
      partes.push('Se necesitan más votos «Sí progresa» que «No progresa» para CON AVANCE');
    }
  }

  return partes.length ? partes.join(' · ') : null;
}
