import {
  ContratoCuentaResultadosError,
  colorVariacionCuenta,
  crearColumnasCuentaResultados,
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
      expect(r.filas).toEqual([{ ...FILA, total_anual: FILA.acumulado_actual }]);
    });

    it('"Total {año}" trimestral: usa total_anual si el backend lo envía; si no, el acumulado del año', () => {
      const conTotal = mapearCuentaResultados({ headers: METADATOS, data: [{ ...FILA, total_anual: 999 }] }, null);
      expect(conTotal.filas[0].total_anual).toBe(999);
      const sinTotal = mapearCuentaResultados({ headers: METADATOS, data: [FILA] }, null);
      expect(sinTotal.filas[0].total_anual).toBe(FILA.acumulado_actual);
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

    it('encabezado de la maqueta: "PYG {nivel}" sobre las cifras y los meses agrupados por año', () => {
      const [cuenta, pyg] = crearColumnasCuentaResultados('2026-08-01', true, 'NORTE 1');
      expect(cuenta.label).toBe('Estado de ganancias y pérdidas · en miles (PEN)');
      expect(cuenta.style?.['text-align']).toBe('left');
      expect(pyg.label).toBe('PYG NORTE 1');

      const [anioPasado, anioActual] = pyg.subs!;
      expect(anioPasado.label).toBe('2025');
      expect(anioPasado.subs!.map((c) => c.label)).toEqual(['Ago']);
      expect(anioActual.label).toBe('2026');
      expect(anioActual.subs!.map((c) => c.label)).toEqual(['Jul', 'Preliminar Ago']);

      expect(pyg.subs!.slice(2).map((c) => c.label)).toEqual([
        'Ago.26 vs Jul.26',
        'Acum Ago.25',
        'Acum Ago.26',
        'Ago.26 vs Ago.25',
        'Ago.26 vs Ago.25 %',
      ]);
      expect(crearColumnasCuentaResultados('2026-08-01', false)[1].label).toBe('PYG');
    });

    it('el mes preliminar va en mostaza con texto negro; cerrado, solo con su nombre', () => {
      const preliminar = hojas(crearColumnasCuentaResultados('2026-08-01', true)).find((c) => c.key === 'periodo_actual')!;
      expect(preliminar.style?.['background']).toBe('var(--mis-escala-3)');
      expect(preliminar.style?.['color']).toBe('var(--mis-escala-3-texto)');

      const cerrado = hojas(crearColumnasCuentaResultados('2026-05-01', false)).find((c) => c.key === 'periodo_actual')!;
      expect(cerrado.label).toBe('May');
      expect(cerrado.style?.['background']).toBeUndefined();
    });

    it('las cifras y sus encabezados van a la derecha', () => {
      for (const c of hojas(crearColumnasCuentaResultados('2026-08-01', false)).slice(1)) {
        expect(c.style?.['text-align'], c.key).toBe('right');
        expect(c.cellStyle?.['text-align'], c.key).toBe('right');
      }
    });

    it('enero compara contra diciembre del año anterior, cada mes bajo su año', () => {
      const pyg = crearColumnasCuentaResultados('2026-01-01', false)[1];
      expect(pyg.subs!.map((c) => c.label).slice(0, 3)).toEqual(['2025', '2026', 'Ene.26 vs Dic.25']);
      expect(pyg.subs![0].subs!.map((c) => c.label)).toEqual(['Ene', 'Dic']);
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

    it('sobre la banda navy del resultado el color se aclara para que se vea', () => {
      expect(colorVariacionCuenta(1, { cuenta_codigo: 'CR021', style: 3 })).toBe('color-mix(in srgb, var(--mis-success) 55%, white)');
    });
  });

  it('distingue detalle, principal y resultado por `style`, como la maqueta', () => {
    expect(estiloFilaCuenta({ style: 1 })).toEqual(expect.objectContaining({ 'font-weight': '500', color: 'var(--mis-text-secondary)' }));
    expect(estiloFilaCuenta({ style: 2 })).toEqual(expect.objectContaining({ 'font-weight': '800', background: 'var(--mis-primary-light)' }));
    expect(estiloFilaCuenta({ style: 3 })).toEqual(
      expect.objectContaining({ background: 'var(--mis-primary)', color: 'var(--mis-text-on-primary)' }),
    );
  });

  it('sangra la cuenta según su nivel', () => {
    const cuenta = crearColumnasCuentaResultados('2026-06-01', false)[0];
    const sangria = (style: number) => cuenta.cellStyleFn?.('', { style })?.['padding-left'];
    expect([1, 2, 3, 4, 5].map(sangria)).toEqual(['30px', '12px', '12px', '50px', '90px']);
  });
});
