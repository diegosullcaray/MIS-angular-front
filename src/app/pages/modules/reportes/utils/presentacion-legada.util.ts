import type { TablaReporteResultado } from '../models/tabla-reporte.model';

/** Compatibilidad de regularData: traducir cabeceras legacy a metadatos de UI.
 * Las tablas compartidas no interpretan nombres ni cambian el orden recibido.
 * Reportes nuevos deben declarar style.color y ordenPresentacion en su adaptador.
 */
export function normalizarPresentacionLegada(tabla: TablaReporteResultado): TablaReporteResultado {
  const columnas = tabla.headers.flatMap((fila) => fila.columns).filter((col) => col != null);
  const datos = columnas.filter((col) => col.isdata != null).sort((a, b) => (a.isdata ?? 0) - (b.isdata ?? 0));
  for (let i = 1; i < datos.length; i++) {
    const sem = datos[i];
    const anterior = datos[i - 1];
    if (sem.format?.['type'] !== 'traffic-light' || anterior.format?.['type'] === 'traffic-light') continue;
    const nombre = (clave: string) => clave.toLowerCase().replace(/^(sem_|dist_|meta_)/, '').replace(/_v\d+$/, '');
    const a = nombre(sem.columnDef);
    const b = nombre(anterior.columnDef);
    const pareja = a.length > 2 && b.length > 2 && (a.includes(b) || b.includes(a));
    // Caracterización de la presentación existente, no una regla para tablas nuevas.
    if (pareja || i === datos.length - 1) [datos[i - 1], datos[i]] = [sem, anterior];
  }
  const orden = new Map(datos.map((col, i) => [col, i]));
  return {
    ...tabla,
    headers: tabla.headers.map((fila) => ({
      ...fila,
      columns: fila.columns.map((col) => col == null ? col : ({
        ...col,
        ...(orden.has(col) ? { ordenPresentacion: col.ordenPresentacion ?? orden.get(col) } : {}),
        style: {
          ...col.style,
          color: col.style?.['color'] ?? ((col.header ?? col.columnDef).toLowerCase().includes('real')
            ? 'var(--mis-success)' : 'var(--mis-text-on-primary)'),
        },
      })),
    })),
  };
}
