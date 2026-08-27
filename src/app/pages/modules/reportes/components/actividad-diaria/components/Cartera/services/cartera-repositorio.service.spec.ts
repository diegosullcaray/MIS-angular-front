import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CarteraRepositorioService } from './cartera-repositorio.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../../../../core/interfaces/shell-state.model';
import { COLUMNAS_RANKING_COMERCIAL } from '../models/ranking-comercial.columnas';

const NODO = { tip_cod: 9, cod_rel: 'FC' };

function usuario(): UsuarioActivo {
  return { id: '1', nombre: 'Ana', email: 'ana@confianza.pe', rol: 'admin-general', subsistemas: [], fechaCorte: '20251130' };
}

function respuesta(resultado: unknown) {
  return of({ code: '0', headers: {}, body: { resultado } });
}

describe('CarteraRepositorioService', () => {
  let getRegularTableResult: ReturnType<typeof vi.fn>;
  let servicio: CarteraRepositorioService;

  beforeEach(() => {
    getRegularTableResult = vi.fn().mockReturnValue(respuesta({ headers: '[]', data: [] }));
    TestBed.configureTestingModule({ providers: [{ provide: ModReportesService, useValue: { getRegularTableResult } }] });
    TestBed.inject(ShellStateService).setUsuarioActivo(usuario());
    servicio = TestBed.inject(CarteraRepositorioService);
  });

  it('"Estructura de Desembolsos" pide RS_DESEMB_01 con `tip_cod`/`cod_rel`/`fec`', () => {
    servicio.estructuraDesembolsos(NODO).subscribe();
    expect(getRegularTableResult).toHaveBeenCalledWith('RS_DESEMB_01', { tip_cod: 9, cod_rel: 'FC', fec: '2025-11-30' });
  });

  /**
   * Tarea 3 de `incidencias-carteras-actualizado.md`: este reporte no debe
   * colgar del filtro global. El legado manda `territorio` y `corredor` en '0'
   * FIJO, trae el ranking completo y filtra del lado del cliente.
   */
  it('"Ranking Comercial" NO usa la jerarquía: manda `territorio`/`corredor` en "0"', () => {
    servicio.rankingComercial().subscribe();
    expect(getRegularTableResult).toHaveBeenCalledWith('RS_RANK_COM_01', {
      territorio: '0',
      corredor: '0',
      fecha: '2025-11-30',
    });
  });

  it('"Ranking Comercial" usa sus cabeceras fijas, no las del payload', () => {
    getRegularTableResult.mockReturnValue(respuesta({ headers: JSON.stringify([{ key: 'x', label: 'Del backend' }]), data: [] }));

    let columnas: unknown;
    servicio.rankingComercial().subscribe((r) => (columnas = r.columnas));

    expect(columnas).toBe(COLUMNAS_RANKING_COMERCIAL);
  });

  describe('semáforo de "Ranking Comercial"', () => {
    /** `Timing` llega en porcentaje (20.83 = 20.83% del mes transcurrido). */
    function conTiming(timing: number, avance: number) {
      getRegularTableResult.mockReturnValue(
        respuesta({ headers: '[]', data: [{ Timing: timing, Percent_Cumpl: avance }] }),
      );
      let fila: Record<string, unknown> = {};
      servicio.rankingComercial().subscribe((r) => (fila = r.filas[0]));
      return fila['Percent_Cumpl_Semaforo'];
    }

    // Devuelve la señal (`1`/`0`/`-1`), no el emoji: el punto lo pinta la tabla vía `semaforoKey`,
    // con el mismo indicador que el resto del sistema. El porcentaje va en su propia columna.
    it('verde cuando el avance alcanza los días transcurridos', () => {
      expect(conTiming(20, 0.25)).toBe(1);
    });

    it('amarillo cuando el avance llega al 80% de los días transcurridos', () => {
      expect(conTiming(50, 0.4)).toBe(0);
    });

    it('rojo cuando se queda por debajo de ese 80%', () => {
      expect(conTiming(50, 0.1)).toBe(-1);
    });

    it('sin `Timing` no hay señal, para no inventar un estado', () => {
      expect(conTiming(0, 0.25)).toBe('');
    });

    it('un avance vacío queda vacío', () => {
      getRegularTableResult.mockReturnValue(respuesta({ headers: '[]', data: [{ Timing: 20, Percent_Cumpl: null }] }));
      let fila: Record<string, unknown> = {};
      servicio.rankingComercial().subscribe((r) => (fila = r.filas[0]));
      expect(fila['Percent_Cumpl_Semaforo']).toBe('');
    });
  });

  describe('"Monitor de Inteligencia de Negocios"', () => {
    const COLUMNAS = [{ titulo: 'Metas', estilo: 'met', tarjetas: [] }];

    it('lee el tablero de `headers`, que es donde lo manda este reporte', () => {
      getRegularTableResult.mockReturnValue(respuesta({ headers: JSON.stringify(COLUMNAS) }));

      let columnas: unknown;
      servicio.monitorInteligencia(NODO).subscribe((c) => (columnas = c));

      expect(getRegularTableResult).toHaveBeenCalledWith('RS_MON_INT_COM_01', { tip_cod: 9, cod_rel: 'FC', fecha: '2025-11-30' });
      expect(columnas).toEqual(COLUMNAS);
    });

    it('desenvuelve un nivel cuando el tablero llega anidado', () => {
      getRegularTableResult.mockReturnValue(respuesta({ headers: JSON.stringify([COLUMNAS]) }));

      let columnas: unknown;
      servicio.monitorInteligencia(NODO).subscribe((c) => (columnas = c));

      expect(columnas).toEqual(COLUMNAS);
    });

    it('sin `headers` no rompe: devuelve un tablero vacío', () => {
      getRegularTableResult.mockReturnValue(respuesta({}));

      let columnas: unknown;
      servicio.monitorInteligencia(NODO).subscribe((c) => (columnas = c));

      expect(columnas).toEqual([]);
    });
  });
});

describe('"Gestión Comercial"', () => {
  let getRegularTableResult: ReturnType<typeof vi.fn>;
  let servicio: CarteraRepositorioService;

  beforeEach(() => {
    getRegularTableResult = vi.fn().mockReturnValue(respuesta({ headers: '[]', data: [] }));
    TestBed.configureTestingModule({ providers: [{ provide: ModReportesService, useValue: { getRegularTableResult } }] });
    TestBed.inject(ShellStateService).setUsuarioActivo(usuario());
    servicio = TestBed.inject(CarteraRepositorioService);
  });

  it('pide sus tres tablas y sus siete gráficos con los mismos parámetros', () => {
    servicio.gestionComercial(NODO).subscribe();

    const codReps = getRegularTableResult.mock.calls.map((c) => c[0]);
    expect(codReps.slice(0, 3)).toEqual(['RS_GEST_COM_01', 'RS_GEST_COM_02', 'RS_GEST_COM_03']);
    expect(codReps.slice(3).sort()).toEqual([
      'GRAF_GEST_COM_01',
      'GRAF_GEST_COM_02',
      'GRAF_GEST_COM_03',
      'GRAF_GEST_COM_04',
      'GRAF_GEST_COM_05',
      'GRAF_GEST_COM_06',
      'GRAF_GEST_COM_07',
    ]);
    for (const [, params] of getRegularTableResult.mock.calls) {
      expect(params).toEqual({ tip_cod: 9, cod_rel: 'FC', fecha: '2025-11-30' });
    }
  });

  it('reparte el `data` de RS_GEST_COM_01 y deja que las otras dos traigan sus cabeceras', () => {
    getRegularTableResult.mockImplementation((codRep: string) => {
      if (codRep === 'RS_GEST_COM_01') return respuesta({ headers: '[]', data: [{ descripcion: 'FC' }] });
      if (codRep === 'RS_GEST_COM_02') {
        return respuesta({ headers: JSON.stringify([{ key: 'a', label: 'A' }]), data: [{ a: 1 }] });
      }
      return respuesta({ headers: '[]', data: [] });
    });

    let r: { filas: unknown[]; varSaldoVigente: { columnas: unknown[] } } | undefined;
    servicio.gestionComercial(NODO).subscribe((x) => (r = x));

    expect(r!.filas).toEqual([{ descripcion: 'FC' }]);
    expect(r!.varSaldoVigente.columnas).toEqual([{ key: 'a', label: 'A' }]);
  });

  /**
   * Tarea 2 de `incidencias-carteras-actualizado.md`: "corregir y renderizar las
   * gráficas". Los siete bloques quedaban en blanco porque se leían de
   * `headers`, y estos NO lo usan: el legado busca el `{categories, series}` en
   * `data[0]`, en el PRIMER campo de la fila, y solo cae a `headers` si `data`
   * viene vacío.
   */
  describe('gráficos', () => {
    const GRAFICO = { categories: ['Ene', 'Feb'], series: [{ name: 'Desembolsos', data: [1, 2] }] };

    /** Cada bloque nombra ese primer campo distinto: lo que importa es que sea el primero. */
    function conGrafico(codRep: string, campo: string, carga: unknown) {
      getRegularTableResult.mockImplementation((cod: string) =>
        cod === codRep ? respuesta({ headers: '[]', data: [{ [campo]: carga }] }) : respuesta({ headers: '[]', data: [] }),
      );
    }

    function graficoDe(titulo: string) {
      let r: { graficos: { titulo: string; categorias: string[]; series: unknown[]; formato: string }[] } | undefined;
      servicio.gestionComercial(NODO).subscribe((x) => (r = x));
      return r!.graficos.find((g) => g.titulo === titulo)!;
    }

    it('lee el payload del PRIMER campo de `data[0]`, no de `headers`', () => {
      conGrafico('GRAF_GEST_COM_04', 'json_grafico', JSON.stringify(GRAFICO));

      const grafico = graficoDe('Ingresos y Salidas');
      expect(grafico.categorias).toEqual(['Ene', 'Feb']);
      expect(grafico.series).toEqual([{ nombre: 'Desembolsos', datos: [1, 2] }]);
    });

    it('cae a `headers` solo cuando `data` viene vacío', () => {
      getRegularTableResult.mockImplementation((cod: string) =>
        cod === 'GRAF_GEST_COM_04' ? respuesta({ headers: JSON.stringify(GRAFICO), data: [] }) : respuesta({ headers: '[]', data: [] }),
      );

      expect(graficoDe('Ingresos y Salidas').categorias).toEqual(['Ene', 'Feb']);
    });

    it('un payload ilegible deja ese gráfico vacío, sin tumbar a los otros seis', () => {
      conGrafico('GRAF_GEST_COM_04', 'json_grafico', 'no es json');

      let r: { graficos: { titulo: string; categorias: string[] }[] } | undefined;
      servicio.gestionComercial(NODO).subscribe((x) => (r = x));

      expect(r!.graficos).toHaveLength(7);
      expect(r!.graficos.find((g) => g.titulo === 'Ingresos y Salidas')!.categorias).toEqual([]);
    });

    /** El legado multiplica la TAPP por 100 y la rotula en "%", sobre el eje secundario. */
    it('"Desembolsos Diarios" pasa la TAPP a porcentaje y la marca como tal', () => {
      conGrafico(
        'GRAF_GEST_COM_01',
        'json_grafico',
        JSON.stringify({ categories: ['Ene'], series: [{ name: 'Desembolsos', data: [100] }, { name: 'TAPP', data: [0.2345] }] }),
      );

      expect(graficoDe('Desembolsos Diarios').series).toEqual([
        { nombre: 'Desembolsos', datos: [100] },
        { nombre: 'TAPP %', datos: [23.45] },
      ]);
    });

    /**
     * Los dos evolutivos que mezclan un NIVEL con su VARIACIÓN: el legado pinta
     * el nivel como línea en su propio eje. Sin eso las dos series comparten
     * escala y la variación queda pegada al cero.
     */
    it.each([
      ['GRAF_GEST_COM_02', 'Saldo Cartera Vigente', 'Saldo Vigente', 'Var. Saldo Vigente'],
      ['GRAF_GEST_COM_07', 'Variación Cliente Stock', 'Cliente Stock', 'Var. Cliente Stock'],
    ])('%s manda el nivel al eje secundario y deja la variación en columnas', (codRep, titulo, nivel, variacion) => {
      conGrafico(
        codRep,
        'json_grafico',
        JSON.stringify({ categories: ['Ene'], series: [{ name: nivel, data: [1] }, { name: variacion, data: [2] }] }),
      );

      expect(graficoDe(titulo).series).toEqual([
        { nombre: nivel, datos: [1], secundaria: true },
        { nombre: variacion, datos: [2] },
      ]);
    });

    it('cada gráfico lleva el formato de tooltip que le toca', () => {
      let r: { graficos: { titulo: string; formato: string }[] } | undefined;
      servicio.gestionComercial(NODO).subscribe((x) => (r = x));

      const formatos = Object.fromEntries(r!.graficos.map((g) => [g.titulo, g.formato]));
      expect(formatos['Ingresos y Salidas']).toBe('soles');
      expect(formatos['Variación Stock Clientes']).toBe('numero');
    });
  });

  /** Tarea 2: "actualmente no se están mapeando los KPIs en la vista". */
  describe('KPIs del encabezado', () => {
    it('salen de la fila TOTAL de `RS_GEST_COM_01`, no de un bloque aparte', () => {
      getRegularTableResult.mockImplementation((cod: string) =>
        cod === 'RS_GEST_COM_01'
          ? respuesta({
              headers: '[]',
              data: [
                { prod_ind: 13.88, TMMPROD: 0.76, Percent_Cumpl: 0.96, mont_dese_2: 244_050_000, HVSALVIGMN: 1_000, HRODAM: 500, hvalvar_136: 200 },
                { prod_ind: 99 },
              ],
            })
          : respuesta({ headers: '[]', data: [] }),
      );

      let r: { kpis: { productividad: number; tmmProductividad: number; cumplProductividad: number; cancelacionVigente: number } } | undefined;
      servicio.gestionComercial(NODO).subscribe((x) => (r = x));

      expect(r!.kpis.productividad).toBe(13.88);
      expect(r!.kpis.tmmProductividad).toBe(0.76);
      // Llega como fracción y la vista lo pinta en %.
      expect(r!.kpis.cumplProductividad).toBeCloseTo(96);
      // El legado la despeja: desembolsos − variación de saldo vigente − rodamiento.
      expect(r!.kpis.cancelacionVigente).toBe(244_050_000 - 1_000 - 500);
    });

    it('sin filas quedan todos en cero en vez de romper la vista', () => {
      let r: { kpis: { productividad: number; carteraVigente: number } } | undefined;
      servicio.gestionComercial(NODO).subscribe((x) => (r = x));

      expect(r!.kpis.productividad).toBe(0);
      expect(r!.kpis.carteraVigente).toBe(0);
    });
  });

  /** Tarea 2: el filtro de fecha reemplaza al corte del usuario en TODAS las consultas. */
  describe('filtro de periodo', () => {
    it('usa el corte del usuario cuando no se elige periodo', () => {
      servicio.gestionComercial(NODO).subscribe();

      for (const [, params] of getRegularTableResult.mock.calls) {
        expect(params).toMatchObject({ fecha: '2025-11-30' });
      }
    });

    it('la fecha elegida viaja a las tres tablas y a los siete gráficos', () => {
      servicio.gestionComercial(NODO, '2025-10-31').subscribe();

      expect(getRegularTableResult.mock.calls).toHaveLength(10);
      for (const [, params] of getRegularTableResult.mock.calls) {
        expect(params).toEqual({ tip_cod: 9, cod_rel: 'FC', fecha: '2025-10-31' });
      }
    });

    it('las opciones salen de `RS_FECH02` (no del `RS_FECH` de Seguros)', () => {
      getRegularTableResult.mockReturnValue(
        of({ code: '0', headers: {}, body: { resultado: { meta1: [{ json_result: '[]' }] } } }),
      );

      servicio.periodosGestionComercial().subscribe();

      expect(getRegularTableResult).toHaveBeenCalledWith('RS_FECH02', { fec: '2025-11-30' });
    });
  });
});
