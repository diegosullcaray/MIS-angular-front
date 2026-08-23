import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClientesSimplesService } from './clientes-simples.service';
import { RankingMujerService } from './ranking-mujer.service';
import { MovimientoClientesService } from './movimiento-clientes.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../../../../core/interfaces/shell-state.model';
import type { MovimientoClientesResultado } from '../models/movimiento-clientes.model';

const NODO = { tip_cod: 9, cod_rel: 'FC' };

function usuario(): UsuarioActivo {
  return { id: '1', nombre: 'Ana', email: 'ana@confianza.pe', rol: 'admin-general', subsistemas: [], fechaCorte: '20251130' };
}

function mixto(result: unknown) {
  return of({ code: '0', headers: {}, body: { result } });
}

function tablaRegular(resultado: unknown) {
  return of({ code: '0', headers: {}, body: { resultado } });
}

describe('Reportes de Clientes', () => {
  let getRegularData: ReturnType<typeof vi.fn>;
  let getDeprecatedData: ReturnType<typeof vi.fn>;
  let getRegularTableResult: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const vacio = { headers: [], body: [], additional: {} };
    getRegularData = vi.fn().mockReturnValue(mixto(vacio));
    getDeprecatedData = vi.fn().mockReturnValue(mixto(vacio));
    getRegularTableResult = vi.fn().mockReturnValue(tablaRegular({ headers: '[]', data: [] }));

    TestBed.configureTestingModule({
      providers: [{ provide: ModReportesService, useValue: { getRegularData, getDeprecatedData, getRegularTableResult } }],
    });
    TestBed.inject(ShellStateService).setUsuarioActivo(usuario());
  });

  describe('los que salen del `report-cra-v1p1` (motor mixto)', () => {
    it('"Clientes Nuevos y Recurrentes" pide Clientes_nuevoRec_01', () => {
      TestBed.inject(ClientesSimplesService).nuevosRecurrentes(NODO).subscribe();
      expect(getRegularData.mock.calls[0][0]).toBe('Clientes_nuevoRec_01');
    });

    it('"Clientes y Operaciones" pide Clientes_Ope_01', () => {
      TestBed.inject(ClientesSimplesService).operaciones(NODO).subscribe();
      expect(getRegularData.mock.calls[0][0]).toBe('Clientes_Ope_01');
    });

    it('"Clientes Flujo" pide CMG_CLIF_01', () => {
      TestBed.inject(ClientesSimplesService).cmgFlujo(NODO).subscribe();
      expect(getRegularData.mock.calls[0][0]).toBe('CMG_CLIF_01');
    });

    it('"Stock de Clientes" va por el strand deprecado, porque su `reportType` está comentado en el legado', () => {
      TestBed.inject(ClientesSimplesService).cmgStock(NODO).subscribe();

      expect(getRegularData).not.toHaveBeenCalled();
      expect(getDeprecatedData).toHaveBeenCalledWith(
        'rda/administracion/clientes/cmg_cliente_01',
        expect.objectContaining({ tip_cod: 9, cod_rel: 'FC', fec: '20251130' }),
      );
    });
  });

  describe('"Ranking Mujer" (motor `table.regular`)', () => {
    it('pide sus dos tablas con los nombres de parámetro de ESTE reporte', () => {
      TestBed.inject(RankingMujerService).obtener(NODO).subscribe();

      // Acá el motor espera `tip_cod`/`cod_rel`/`fec`, no los `tipcod`/`codrel`/`fecha` de Carterización.
      const esperado = { tip_cod: 9, cod_rel: 'FC', fec: '2025-11-30' };
      expect(getRegularTableResult.mock.calls.map((c) => c[0])).toEqual(['RS_RANK_MUJ_01', 'RS_RANK_MUJ_02']);
      expect(getRegularTableResult.mock.calls[0][1]).toEqual(esperado);
      expect(getRegularTableResult.mock.calls[1][1]).toEqual(esperado);
    });
  });

  describe('"Movimiento de Clientes"', () => {
    it('pide el reporte sin parámetros: es el único de Clientes sin jerarquía', () => {
      TestBed.inject(MovimientoClientesService).obtener().subscribe();
      expect(getRegularTableResult).toHaveBeenCalledWith('MOVIMIENTO_CLIENTES_01', {});
    });

    it('reparte las filas por su columna `gru`, que es lo que separa una tabla de otra', () => {
      getRegularTableResult.mockReturnValue(
        tablaRegular({
          headers: JSON.stringify([{ key: 'desc', label: 'Descripción' }]),
          data: [
            { gru: 1, desc: 'activo-a' },
            { gru: 2, desc: 'pasivo' },
            { gru: 1, desc: 'activo-b' },
            { gru: 11, desc: 'rural' },
          ],
        }),
      );

      let r: MovimientoClientesResultado | undefined;
      TestBed.inject(MovimientoClientesService)
        .obtener()
        .subscribe((x) => (r = x));

      expect(r!.columnas).toEqual([{ key: 'desc', label: 'Descripción' }]);
      expect(r!.grupos[1].map((f) => f['desc'])).toEqual(['activo-a', 'activo-b']);
      expect(r!.grupos[2].map((f) => f['desc'])).toEqual(['pasivo']);
      expect(r!.grupos[11].map((f) => f['desc'])).toEqual(['rural']);
    });

    it('un `gru` sin filas simplemente no aparece', () => {
      getRegularTableResult.mockReturnValue(
        tablaRegular({ headers: '[]', data: [{ gru: 1, desc: 'a' }] }),
      );

      let r: MovimientoClientesResultado | undefined;
      TestBed.inject(MovimientoClientesService)
        .obtener()
        .subscribe((x) => (r = x));

      expect(r!.grupos[7]).toBeUndefined();
    });
  });
});
