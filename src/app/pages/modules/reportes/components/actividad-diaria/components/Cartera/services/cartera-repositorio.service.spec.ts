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
});
