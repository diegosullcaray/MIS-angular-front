import type { ColumnaReporte, TablaReporteResultado } from '../models/tabla-reporte.model';

const esSemaforo = (columna: ColumnaReporte): boolean => columna.format?.['type'] === 'traffic-light';

/**
 * Corrige los reportes del motor "mixto" que emiten los semáforos corridos una
 * columna: el backend pega cada semáforo a la columna que tiene DELANTE, pero
 * en realidad colorea la que va DESPUÉS.
 *
 * Confirmado contra el legado en `DESEMP_SOC_01`: el semáforo pegado a "META"
 * colorea "TMM", el pegado a "TMM" colorea "TAM", y "META" nunca tiene semáforo
 * propio. `GCMGCAP_01` ("CMG Captaciones - Agencias") emite la misma forma:
 * "METAS" es el rótulo sin punto y los puntos son de "TMM"/"TAM"/"TFM".
 *
 * Sin esta corrección la primera columna del bloque se queda el punto de la
 * segunda y toda la fila se ve desplazada una columna a la izquierda, dejando
 * la última métrica vacía.
 *
 * Reordena solo la fila de encabezado de nivel 1, dejando cada valor seguido
 * del semáforo que de verdad le corresponde y renumerando `isdata` para que el
 * cuerpo se alinee. Es la versión genérica del ajuste que ya hacía a mano
 * `corregirSemaforosDesempenoSocial()`: no depende de los `columnDef`.
 */
export function corregirSemaforosDesplazados(resultado: TablaReporteResultado): TablaReporteResultado {
  const filaNivel1 = resultado.headers[0];
  if (!filaNivel1) return resultado;

  const columnas = filaNivel1.columns;

  // El bloque de métricas empieza en el primer valor con dato al que le sigue
  // un semáforo; todo lo anterior (ej. "Variable", los grupos "2025"/"2026")
  // se conserva tal cual.
  const inicio = columnas.findIndex(
    (columna, i) => columna.isdata != null && !esSemaforo(columna) && !!columnas[i + 1] && esSemaforo(columnas[i + 1]),
  );
  if (inicio === -1) return resultado;

  const prefijo = columnas.slice(0, inicio);
  const bloque = columnas.slice(inicio).filter((c) => c.isdata != null);
  const valores = bloque.filter((c) => !esSemaforo(c));
  const semaforos = bloque.filter(esSemaforo);
  if (valores.length === 0 || semaforos.length === 0) return resultado;

  // El primer valor del bloque no tiene semáforo; a partir del segundo, cada
  // uno se queda el semáforo que el backend había pegado al valor anterior.
  const reordenado: ColumnaReporte[] = [{ ...valores[0], cols: 1 }];
  for (let i = 1; i < valores.length; i++) {
    const semaforo = semaforos[i - 1];
    reordenado.push({ ...valores[i], cols: semaforo ? 2 : 1 });
    if (semaforo) reordenado.push({ ...semaforo });
  }
  // Semáforos sobrantes (más semáforos que valores): se anexan al final para
  // no perder su dato ni descuadrar el conteo de columnas del cuerpo.
  for (let i = valores.length - 1; i < semaforos.length; i++) reordenado.push({ ...semaforos[i] });

  let siguienteIsdata = Math.max(0, ...prefijo.map((c) => c.isdata ?? 0)) + 1;
  const conIsdata = reordenado.map((columna) => ({ ...columna, isdata: siguienteIsdata++ }));

  return {
    ...resultado,
    headers: [{ ...filaNivel1, columns: [...prefijo, ...conIsdata] }, ...resultado.headers.slice(1)],
  };
}
