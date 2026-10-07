import {
  ContratoCuentaResultadosError,
  colorVariacionCuenta,
  crearColumnasCuentaResultados,
  cuentasConDetalle,
  filasConDrillDown,
  estiloFilaCuenta,
  fondoOpaco,
  etiquetaPeriodoCuenta,
  fechaCuentaParaBackend,
  leerMetadatosCuenta,
  mapearCuentaResultados,
  normalizarFechaCuenta,
} from './cuenta-resultados.util';
import type { ColumnaDinamica } from '../../../models/tabla-dinamica.model';

/** Casos tomados de las specs del legado `cuenta-resultados.{component,util}.spec.ts`. */
const METADATOS = JSON.stringify({ preliminar: 1, fechas: ['2026-06-01', '2026-05-01', '2026-04-01'] });
const FILA = {
  style: 2,
  cuenta_codigo: 'CR012',
  cuenta_nombre: 'INGRESOS FINANCIEROS',
  orden: 1,
  periodo_anio_anterior: 1,
  periodo_anterior: 2,
  periodo_actual: 3,
  variacion_periodo_anterior: 1,
  acumulado_anio_anterior: 4,
  acumulado_actual: 5,
  variacion_acumulado: 1,
  variacion_acumulado_pct: 0.25,
};

function hojas(columnas: ColumnaDinamica[]): ColumnaDinamica[] {
  return columnas.flatMap((c) => (c.subs?.length ? hojas(c.subs) : [c]));
}

describe('cuenta-resultados.util', () => {
  describe('columna fija de cuentas', () => {
    it('apila el fondo del nivel sobre la superficie sólida, para tapar las cifras al desplazar', () => {
      expect(fondoOpaco('var(--mis-hover-bg)')).toBe('linear-gradient(var(--mis-hover-bg), var(--mis-hover-bg)), var(--mis-surface)');
      expect(fondoOpaco(undefined)).toBe('var(--mis-surface)');
    });

    it('la celda de cuenta es sticky y lleva fondo opaco en todos los niveles', () => {
      const [cuenta] = crearColumnasCuentaResultados('2026-06-01', false);
      expect(cuenta.cellStyle).toEqual(expect.objectContaining({ position: 'sticky', left: '0' }));
      for (const style of [1, 2, 3, 4]) {
        expect(cuenta.cellStyleFn!(null, { style })!['background']).toContain('var(--mis-surface)');
      }
    });
  });

  describe('fechas', () => {
    it('acepta solo YYYY-MM-DD de calendario', () => {
      expect(normalizarFechaCuenta('2026-05-01')).toBe('2026-05-01');
      expect(normalizarFechaCuenta('2026-02-30')).toBeNull();
      expect(normalizarFechaCuenta('20260501')).toBeNull();
      expect(normalizarFechaCuenta('Mayo 2026')).toBeNull();
      expect(normalizarFechaCuenta(null)).toBeNull();
    });

    it('envía la fecha como YYYYMMDD', () => {
      expect(fechaCuentaParaBackend('2026-05-01')).toBe('20260501');
      expect(fechaCuentaParaBackend('2026-13-01')).toBeNull();
    });

    it('rotula el periodo en español con mayúscula inicial', () => {
      expect(etiquetaPeriodoCuenta('2026-06-01')).toBe('Junio de 2026');
    });
  });

  describe('metadatos', () => {
    it('lee preliminar y fechas', () => {
      expect(leerMetadatosCuenta(METADATOS)).toEqual({
        preliminar: 1,
        fechas: ['2026-06-01', '2026-05-01', '2026-04-01'],
      });
    });

    it('rechaza lo que no cumple el contrato', () => {
      expect(leerMetadatosCuenta('[]')).toBeNull();
      expect(leerMetadatosCuenta('no-json')).toBeNull();
      expect(leerMetadatosCuenta(undefined)).toBeNull();
      expect(leerMetadatosCuenta(JSON.stringify({ preliminar: 2, fechas: ['2026-06-01'] }))).toBeNull();
      expect(leerMetadatosCuenta(JSON.stringify({ preliminar: 0, fechas: [] }))).toBeNull();
      expect(leerMetadatosCuenta(JSON.stringify({ preliminar: 0, fechas: ['2026-6-1'] }))).toBeNull();
    });
  });

  describe('mapearCuentaResultados', () => {
    it('con NOW toma el primer periodo devuelto', () => {
      const r = mapearCuentaResultados({ headers: METADATOS, data: [FILA] }, null);

      expect(r.fecha).toBe('2026-06-01');
      expect(r.preliminar).toBe(true);
      expect(r.periodos.map((p) => p.id)).toEqual(['2026-06-01', '2026-05-01', '2026-04-01']);
      expect(r.periodos[0].desc).toBe('Junio de 2026');
      expect(r.filas).toEqual([FILA]);
    });

    it('conserva la fecha pedida si está entre los periodos', () => {
      expect(mapearCuentaResultados({ headers: METADATOS, data: [FILA] }, '2026-05-01').fecha).toBe('2026-05-01');
    });

    it('sin filas es vacío, no error', () => {
      expect(mapearCuentaResultados({ headers: METADATOS, data: [] }, null).filas).toEqual([]);
    });

    it('metadatos o data inválidos son error de contrato con el mensaje del legado', () => {
      expect(() => mapearCuentaResultados({ headers: '[]', data: [] }, null)).toThrow(
        new ContratoCuentaResultadosError('El reporte devolvió metadatos inválidos.'),
      );
      expect(() => mapearCuentaResultados({ headers: METADATOS }, null)).toThrow(
        new ContratoCuentaResultadosError('El reporte devolvió una respuesta inválida.'),
      );
      expect(() => mapearCuentaResultados(undefined, null)).toThrow(ContratoCuentaResultadosError);
    });
  });

  describe('columnas', () => {
    it('la cuenta y las ocho métricas del legado, en su orden', () => {
      const columnas = crearColumnasCuentaResultados('2026-08-01', true);

      expect(hojas(columnas).map((c) => c.key)).toEqual([
        'cuenta_nombre',
        'periodo_anio_anterior',
        'periodo_anterior',
        'periodo_actual',
        'variacion_periodo_anterior',
        'acumulado_anio_anterior',
        'acumulado_actual',
        'variacion_acumulado',
        'variacion_acumulado_pct',
      ]);
    });

    it('no muestra el bloque "Resultado Trimestral"', () => {
      const columnas = crearColumnasCuentaResultados('2026-08-01', true);
      expect(columnas.map((c) => c.label)).not.toContain('Resultado Trimestral');
    });

    it('dos bloques, mes y acumulado, cada uno con sus valores y su variación', () => {
      const [cuenta, mes, acumulado] = crearColumnasCuentaResultados('2026-08-01', true);
      expect(cuenta.label).toBe('Estado de ganancias y pérdidas · en miles (PEN)');
      expect(cuenta.style?.['text-align']).toBe('left');
      expect(mes.label).toBe('Mes de Agosto');
      expect(mes.subs!.map((c) => c.label)).toEqual(['Ago.25', 'Jul.26', 'Preliminar Ago.26', 'Δ Jul']);
      expect(acumulado.label).toBe('Acumulado Ene–Ago');
      expect(acumulado.subs!.map((c) => c.label)).toEqual(['2025', '2026', 'Δ', 'Δ %']);
      expect(acumulado.subs![0].cellStyle?.['border-left']).toBe('2px solid var(--mis-border-strong)');
    });

    it('el mes preliminar va con tinte mostaza; cerrado, con el encabezado claro tipo macOS', () => {
      const preliminar = hojas(crearColumnasCuentaResultados('2026-08-01', true)).find((c) => c.key === 'periodo_actual')!;
      expect(preliminar.style?.['background']).toBe('color-mix(in srgb, var(--mis-escala-3) 30%, var(--mis-surface))');
      expect(preliminar.style?.['color']).toBe('var(--mis-text-primary)');

      const cerrado = hojas(crearColumnasCuentaResultados('2026-05-01', false)).find((c) => c.key === 'periodo_actual')!;
      expect(cerrado.label).toBe('May.26');
      expect(cerrado.style?.['background']).toBe('var(--mis-surface)');
    });

    it('las cifras y sus encabezados van a la derecha', () => {
      for (const c of hojas(crearColumnasCuentaResultados('2026-08-01', false)).slice(1)) {
        expect(c.style?.['text-align'], c.key).toBe('right');
        expect(c.cellStyle?.['text-align'], c.key).toBe('right');
      }
    });

    it('enero compara contra diciembre del año anterior', () => {
      const [, mes, acumulado] = crearColumnasCuentaResultados('2026-01-01', false);
      expect(mes.subs!.map((c) => c.label)).toEqual(['Ene.25', 'Dic.25', 'Ene.26', 'Δ Dic']);
      expect(acumulado.label).toBe('Acumulado Ene');
    });

    it('semáforo en la variación mensual, el acumulado del año y la variación interanual; no en el %', () => {
      const columnas = hojas(crearColumnasCuentaResultados('2026-06-01', false));
      const conPunto = columnas.filter((c) => c.indicadorVariacion === 'punto').map((c) => c.key);
      expect(conPunto).toEqual(['variacion_periodo_anterior', 'acumulado_actual', 'variacion_acumulado']);

      const pct = columnas.find((c) => c.key === 'variacion_acumulado_pct');
      expect(pct?.format?.type).toBe('percent');
      expect(pct?.colorVariacion).toBeUndefined();
    });

    it('el acumulado del año toma el color de su variación contra el año anterior', () => {
      const acumulado = hojas(crearColumnasCuentaResultados('2026-06-01', false)).find((c) => c.key === 'acumulado_actual')!;
      const gasto = { cuenta_codigo: 'CR018', style: 2 };
      expect(acumulado.colorVariacion!(12647, { ...gasto, variacion_acumulado: -1022 })).toBe('var(--mis-success)');
      expect(acumulado.colorVariacion!(12647, { ...gasto, variacion_acumulado: 500 })).toBe('var(--mis-danger)');
      // Sin variación no hay semáforo.
      expect(acumulado.colorVariacion!(12647, gasto)).toBeNull();
    });
  });

  describe('polaridad de la variación', () => {
    it('ingreso: subir es verde, bajar es rojo', () => {
      const ingreso = { cuenta_codigo: 'CR012' };
      expect(colorVariacionCuenta(1, ingreso)).toBe('var(--mis-success)');
      expect(colorVariacionCuenta(-1, ingreso)).toBe('var(--mis-danger)');
    });

    it('gasto: bajar es verde, subir es rojo', () => {
      const gasto = { cuenta_codigo: 'CR018' };
      expect(colorVariacionCuenta(-1, gasto)).toBe('var(--mis-success)');
      expect(colorVariacionCuenta(1, gasto)).toBe('var(--mis-danger)');
    });

    it('el cero es favorable en ambos casos', () => {
      expect(colorVariacionCuenta(0, { cuenta_codigo: 'CR012' })).toBe('var(--mis-success)');
      expect(colorVariacionCuenta(0, { cuenta_codigo: 'CR018' })).toBe('var(--mis-success)');
    });

    it('en la fila de resultado usa los mismos colores (ya no hay banda navy)', () => {
      expect(colorVariacionCuenta(1, { cuenta_codigo: 'CR021', style: 3 })).toBe('var(--mis-success)');
    });
  });

  it('distingue detalle, principal y resultado por `style`, como la maqueta', () => {
    expect(estiloFilaCuenta({ style: 1 })).toEqual(expect.objectContaining({ 'font-weight': '500', color: 'var(--mis-text-secondary)' }));
    expect(estiloFilaCuenta({ style: 2 })).toEqual(expect.objectContaining({ 'font-weight': '700', background: 'var(--mis-primary-light)' }));
    expect(estiloFilaCuenta({ style: 3 })).toEqual(
      expect.objectContaining({ 'border-top': '2px solid var(--mis-primary)', color: 'var(--mis-text-primary)', background: 'var(--mis-surface)' }),
    );
  });

  it('sangra la cuenta según su nivel', () => {
    const cuenta = crearColumnasCuentaResultados('2026-06-01', false)[0];
    const sangria = (style: number) => cuenta.cellStyleFn?.('', { style })?.['padding-left'];
    expect([1, 2, 3, 4, 5].map(sangria)).toEqual(['30px', '12px', '12px', '50px', '90px']);
  });

  describe('drill down por cuenta (data real de PYG)', () => {
    const fila = (style: number, codigo: string, nombre: string) => ({ style, cuenta_codigo: codigo, cuenta_nombre: nombre });
    const FILAS = [
      fila(2, 'FOR001', 'INGRESOS FINANCIEROS'),
      fila(1, 'EF001', 'COEFICIENTES'),
      fila(1, 'S001MN', 'INGRESOS INVERSION GESTIONADA'),
      fila(2, 'FOR004', 'COMISIONES NETAS'),
      fila(1, 'FOR005', 'COMISIONES RECIBIDAS'),
      fila(4, 'PEND001', 'SEGUROS'),
      fila(5, 'PEND004', 'INDIVIDUAL'),
      fila(3, 'FOR010', 'MARGEN BRUTO'),
    ];
    const nombres = (abiertas: string[]) => filasConDrillDown(FILAS, new Set(abiertas)).map((f) => f.cuenta_nombre);

    it('detalle solo bajo cuentas que lo tienen; resultados (3) y hojas no', () => {
      expect([...cuentasConDetalle(FILAS)]).toEqual(['FOR001', 'FOR004', 'FOR005', 'PEND001']);
    });

    it('cerrado deja las raíces; abrir INGRESOS FINANCIEROS muestra su nivel', () => {
      expect(nombres([])).toEqual(['▸ INGRESOS FINANCIEROS', '▸ COMISIONES NETAS', 'MARGEN BRUTO']);
      expect(nombres(['FOR001'])).toEqual([
        '▾ INGRESOS FINANCIEROS',
        'COEFICIENTES',
        'INGRESOS INVERSION GESTIONADA',
        '▸ COMISIONES NETAS',
        'MARGEN BRUTO',
      ]);
    });

    it('un nivel profundo exige que todos sus ancestros estén abiertos', () => {
      expect(nombres(['PEND001'])).toHaveLength(3);
      expect(nombres(['FOR004', 'FOR005', 'PEND001']).slice(1, 5)).toEqual(['▾ COMISIONES NETAS', '▾ COMISIONES RECIBIDAS', '▾ SEGUROS', 'INDIVIDUAL']);
    });
  });
});
