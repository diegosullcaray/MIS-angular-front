import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SegurosService } from './seguros.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../../../../core/interfaces/shell-state.model';

const NODO = { tip_cod: 9, cod_rel: 'FC' };

function usuario(): UsuarioActivo {
  return { id: '1', nombre: 'Ana', email: 'ana@confianza.pe', rol: 'admin-general', subsistemas: [], fechaCorte: '20251130' };
}

describe('SegurosService', () => {
  let getRegularData: ReturnType<typeof vi.fn>;
  let getRegularTableResult: ReturnType<typeof vi.fn>;
  let servicio: SegurosService;

  beforeEach(() => {
    getRegularData = vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: { result: { body: [] } } }));
    getRegularTableResult = vi
      .fn()
      .mockReturnValue(of({ code: '0', headers: {}, body: { resultado: { headers: '[]', data: [] } } }));
    TestBed.configureTestingModule({
      providers: [{ provide: ModReportesService, useValue: { getRegularData, getRegularTableResult } }],
    });
    TestBed.inject(ShellStateService).setUsuarioActivo(usuario());
    servicio = TestBed.inject(SegurosService);
  });

  it('"Reporte Seguros" pide los 4 bloques activos: el `_03` está comentado en el mapa', () => {
    servicio.reporteSeguros(NODO).subscribe();

    expect(getRegularData.mock.calls.map(([codRep]) => codRep)).toEqual([
      'GRSCMIS_01',
      'GRSCMIS_02',
      'GRSCMIS_04',
      'GRSCMIS_05',
    ]);
  });

  it('"Seguros Pasivos" devuelve sus 4 bloques en el orden de PANTALLA, con el `_03` primero', () => {
    servicio.segurosPasivos(NODO).subscribe();

    expect(getRegularTableResult.mock.calls.map(([codRep]) => codRep)).toEqual([
      'RS_SEG_PAS_03',
      'RS_SEG_PAS_01',
      'RS_SEG_PAS_02',
      'RS_SEG_PAS_04',
    ]);
  });

  it('los bloques de repositorio piden `fec` CON GUIONES, no el compacto del motor mixto', () => {
    servicio.segurosPasivos(NODO).subscribe();

    for (const [, params] of getRegularTableResult.mock.calls) {
      expect(params).toEqual({ tip_cod: 9, cod_rel: 'FC', fec: '2025-11-30' });
    }
  });

  it('"Seguros Optativos" pide su único bloque con el mismo formato de fecha', () => {
    servicio.segurosOptativos(NODO).subscribe();

    expect(getRegularTableResult.mock.calls[0][0]).toBe('GRSCMISREP_01');
    expect(getRegularTableResult.mock.calls[0][1]).toEqual({ tip_cod: 9, cod_rel: 'FC', fec: '2025-11-30' });
  });

  describe('"Evolutivo Pasivos" — series serializadas', () => {
    function conBloques(cuerpo1: unknown, cuerpo2: unknown = {}) {
      getRegularData
        .mockReturnValueOnce(of({ code: '0', headers: {}, body: { result: { body: [cuerpo1] } } }))
        .mockReturnValueOnce(of({ code: '0', headers: {}, body: { result: { body: [cuerpo2] } } }));
    }

    it('parsea `categories` y `series` cuando vienen como JSON válido', () => {
      conBloques({
        categories: '["Ene","Feb"]',
        series: '[{"name":"Pólizas","data":[10,20],"color":"#4472c4"}]',
      });

      let graficos: { titulo: string; categorias: string[]; series: { nombre: string; datos: unknown[] }[] }[] = [];
      servicio.evolutivoPasivos(NODO).subscribe((g) => (graficos = g));

      expect(graficos[0].categorias).toEqual(['Ene', 'Feb']);
      expect(graficos[0].series[0]).toMatchObject({ nombre: 'Pólizas', datos: [10, 20] });
    });

    /**
     * El legado resuelve estas cadenas con `eval()`. Acá van por `JSON.parse`:
     * si el backend emitiera literales de JavaScript, el gráfico tiene que
     * quedar VACÍO, nunca mostrar datos inventados.
     */
    it('descarta el bloque si el payload no es JSON, en vez de romper o inventar datos', () => {
      conBloques({ categories: "['Ene','Feb']", series: '[{name:"x",data:[1]}]' });

      let graficos: unknown[] = [];
      expect(() => servicio.evolutivoPasivos(NODO).subscribe((g) => (graficos = g))).not.toThrow();
      expect(graficos).toEqual([]);
    });

    it('descarta el bloque si faltan `categories` o `series`', () => {
      conBloques({ categories: '["Ene"]' });

      let graficos: unknown[] = [];
      servicio.evolutivoPasivos(NODO).subscribe((g) => (graficos = g));

      expect(graficos).toEqual([]);
    });
  });
});
