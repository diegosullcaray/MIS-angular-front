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

  it('"Ranking Comercial" manda el nodo como `territorio`/`corredor`, no como `tip_cod`/`cod_rel`', () => {
    servicio.rankingComercial(NODO).subscribe();
    expect(getRegularTableResult).toHaveBeenCalledWith('RS_RANK_COM_01', {
      territorio: 'FC',
      corredor: 9,
      fecha: '2025-11-30',
    });
  });

  it('"Ranking Comercial" usa sus cabeceras fijas, no las del payload', () => {
    getRegularTableResult.mockReturnValue(respuesta({ headers: JSON.stringify([{ key: 'x', label: 'Del backend' }]), data: [] }));

    let columnas: unknown;
    servicio.rankingComercial(NODO).subscribe((r) => (columnas = r.columnas));

    expect(columnas).toBe(COLUMNAS_RANKING_COMERCIAL);
  });

  describe('semáforo de "Ranking Comercial"', () => {
    /** `Timing` llega en porcentaje (20.83 = 20.83% del mes transcurrido). */
    function conTiming(timing: number, avance: number) {
      getRegularTableResult.mockReturnValue(
        respuesta({ headers: '[]', data: [{ Timing: timing, Percent_Cumpl: avance }] }),
      );
      let fila: Record<string, unknown> = {};
      servicio.rankingComercial(NODO).subscribe((r) => (fila = r.filas[0]));
      return fila['Percent_Cumpl_Semaforo'];
    }

    it('verde cuando el avance alcanza los días transcurridos', () => {
      expect(conTiming(20, 0.25)).toBe('🟢 25.00%');
    });

    it('amarillo cuando el avance llega al 80% de los días transcurridos', () => {
      expect(conTiming(50, 0.4)).toBe('🟡 40.00%');
    });

    it('rojo cuando se queda por debajo de ese 80%', () => {
      expect(conTiming(50, 0.1)).toBe('🔴 10.00%');
    });

    it('sin `Timing` muestra el avance sin semáforo, para no inventar un estado', () => {
      expect(conTiming(0, 0.25)).toBe('25.00%');
    });

    it('un avance vacío queda vacío', () => {
      getRegularTableResult.mockReturnValue(respuesta({ headers: '[]', data: [{ Timing: 20, Percent_Cumpl: null }] }));
      let fila: Record<string, unknown> = {};
      servicio.rankingComercial(NODO).subscribe((r) => (fila = r.filas[0]));
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
