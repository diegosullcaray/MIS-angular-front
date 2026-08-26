import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProyeccionesService } from './proyecciones.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../../../../core/interfaces/shell-state.model';

const NODO = { tip_cod: 9, cod_rel: 'FC' };
const RESPUESTA = { code: '0', headers: {}, body: { result: { headers: [], body: [], additional: {} } } };

function usuario(): UsuarioActivo {
  return { id: '1', nombre: 'Ana', email: 'ana@confianza.pe', rol: 'admin-general', subsistemas: [], fechaCorte: '20251130' };
}

/**
 * `PROYEC_COLREC` tenía el mismo defecto que los cuatro reportes de
 * `incidencias-mora.md` — su host es `report-cra-v11`, que también llama
 * `cs.getRegularData()` — pero nadie lo reportó porque todavía no lo habían
 * abierto. Este spec lo fija para que no vuelva.
 */
describe('ProyeccionesService', () => {
  let getRegularData: ReturnType<typeof vi.fn>;
  let getDeprecatedData: ReturnType<typeof vi.fn>;
  let servicio: ProyeccionesService;

  beforeEach(() => {
    getRegularData = vi.fn().mockReturnValue(of(RESPUESTA));
    getDeprecatedData = vi.fn().mockReturnValue(of(RESPUESTA));
    TestBed.configureTestingModule({
      providers: [{ provide: ModReportesService, useValue: { getRegularData, getDeprecatedData } }],
    });
    TestBed.inject(ShellStateService).setUsuarioActivo(usuario());
    servicio = TestBed.inject(ProyeccionesService);
  });

  it('"Proyección colocación" va por `regularData` aunque su `reportType` esté comentado (host `-v11`)', () => {
    servicio.colocacion(NODO).subscribe();

    expect(getDeprecatedData).not.toHaveBeenCalled();
    expect(getRegularData).toHaveBeenCalledTimes(2);
  });

  it('pide los ids `_01` y `_03`: el `_02` no existe en el mapa', () => {
    servicio.colocacion(NODO).subscribe();

    expect(getRegularData.mock.calls.map(([codRep]) => codRep)).toEqual(['PROYEC_COLREC_01', 'PROYEC_COLREC_03']);
  });

  it('solo el `_01` declara `fec` en el mapa; el `_03` no lleva params propios', () => {
    servicio.colocacion(NODO).subscribe();

    expect(getRegularData.mock.calls[0][1]).toEqual({ tip_cod: 9, cod_rel: 'FC', fec: '20251130' });
    expect(getRegularData.mock.calls[1][1]).toEqual({ tip_cod: 9, cod_rel: 'FC' });
  });

  it('"Proyección diaria" pide `_01` y `_02`: el `_03` está comentado en el mapa', () => {
    servicio.diariaColocacion(NODO).subscribe();

    expect(getRegularData.mock.calls.map(([codRep]) => codRep)).toEqual([
      'PROYEC_DIACOLREC_01',
      'PROYEC_DIACOLREC_02',
    ]);
  });
});
