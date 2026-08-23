import type { ColumnaReporte, FilaEncabezadoReporte, TablaReporteResultado } from '../models/tabla-reporte.model';

const esSemaforo = (c: ColumnaReporte): boolean => c.format?.['type'] === 'traffic-light';

/**
 * Pone cada semáforo a la DERECHA de la métrica que califica.
 *
 * El motor "mixto" emite el semáforo justo ANTES de su valor y le pone `cols:2`
 * al valor para que su `<th>` cubra las dos celdas (`GCMGCAP_01`: `TMM_Sem`
 * (isdata 9) precede a `TMM` (isdata 10, cols 2)). Renderizado tal cual, el
 * punto queda a la izquierda del número.
 *
 * Se intercambia el par —posición e `isdata`— para que la celda del valor vaya
 * primero y su punto después. Solo se tocan esas dos columnas: el resto de los
 * `isdata` queda intacto, que es lo que mantiene alineado el cuerpo con las
 * demás filas de encabezado.
 */
export function moverSemaforosTrasSuValor(resultado: TablaReporteResultado): TablaReporteResultado {
  return { ...resultado, headers: resultado.headers.map(intercambiarPares) };
}

function intercambiarPares(fila: FilaEncabezadoReporte): FilaEncabezadoReporte {
  const columnas = [...(fila.columns ?? [])];

  for (let i = 0; i < columnas.length - 1; i++) {
    const semaforo = columnas[i];
    const valor = columnas[i + 1];
    // El par es "semáforo con dato + métrica que lo absorbe con su colspan".
    if (!esSemaforo(semaforo) || semaforo.isdata == null) continue;
    if (esSemaforo(valor) || valor.isdata == null) continue;

    columnas[i] = { ...valor, isdata: semaforo.isdata };
    columnas[i + 1] = { ...semaforo, isdata: valor.isdata };
    i++; // el par ya quedó resuelto
  }

  return { ...fila, columns: columnas };
}
