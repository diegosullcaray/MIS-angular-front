import {
  ContratoCuentaResultadosError,
  colorVariacionCuenta,
  crearColumnasCuentaResultados,
  estiloFilaCuenta,
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
      const columnas = crearColumnasCuentaResultados('2026-06-01', true);

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
      expect(columnas[1].label).toBe('Mensual');
      expect(columnas[2].label).toBe('Acumulado');
    });

    it('rotula relativo al periodo elegido', () => {
      const etiquetas = hojas(crearColumnasCuentaResultados('2026-06-01', true)).map((c) => c.label);
      expect(etiquetas.slice(1)).toEqual([
        'Jun-25',
        'May-26',
        'Jun-26 · Prelim.',
        'Jun-26 vs May-26',
        'Acum. Jun-25',
        'Acum. Jun-26',
        'Var.',
        'Var. %',
      ]);

      const cerrado = hojas(crearColumnasCuentaResultados('2026-05-01', false));
      expect(cerrado[3].label).toBe('May-26');
    });

    it('enero compara contra diciembre del año anterior', () => {
      expect(hojas(crearColumnasCuentaResultados('2026-01-01', false))[4].label).toBe('Ene-26 vs Dic-25');
    });

    it('solo las variaciones llevan indicador; la porcentual se formatea como porcentaje', () => {
      const conIndicador = hojas(crearColumnasCuentaResultados('2026-06-01', false))
        .filter((c) => c.colorVariacion)
        .map((c) => c.key);
      expect(conIndicador).toEqual(['variacion_periodo_anterior', 'variacion_acumulado', 'variacion_acumulado_pct']);

      const pct = hojas(crearColumnasCuentaResultados('2026-06-01', false)).find((c) => c.key === 'variacion_acumulado_pct');
      expect(pct?.format?.type).toBe('percent');
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
  });

  it('distingue detalle, principal y resultado por `style`', () => {
    expect(estiloFilaCuenta({ style: 1 })['font-weight']).toBe('600');
    expect(estiloFilaCuenta({ style: 2 })['font-weight']).toBe('800');
    expect(estiloFilaCuenta({ style: 3 })['border-top']).toContain('var(--mis-primary)');
  });

  it('sangra la cuenta según su nivel', () => {
    const cuenta = crearColumnasCuentaResultados('2026-06-01', false)[0];
    const sangria = (style: number) => cuenta.cellStyleFn?.('', { style })?.['padding-left'];
    expect([1, 2, 3, 4, 5].map(sangria)).toEqual(['30px', '12px', '12px', '50px', '90px']);
  });
});
