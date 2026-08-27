import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AplicativoMovilService } from './aplicativo-movil.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../../../../core/interfaces/shell-state.model';

const NODO = { tip_cod: 9, cod_rel: 'FC' };
const RESPUESTA = { code: '0', headers: {}, body: { result: { headers: [], body: [], additional: {} } } };

function usuario(): UsuarioActivo {
  return { id: '1', nombre: 'Ana', email: 'ana@confianza.pe', rol: 'admin-general', subsistemas: [], fechaCorte: '20251130' };
}

describe('AplicativoMovilService', () => {
  let getRegularData: ReturnType<typeof vi.fn>;
  let getDeprecatedData: ReturnType<typeof vi.fn>;
  let servicio: AplicativoMovilService;

  beforeEach(() => {
    getRegularData = vi.fn().mockReturnValue(of(RESPUESTA));
    getDeprecatedData = vi.fn().mockReturnValue(of(RESPUESTA));
    TestBed.configureTestingModule({
      providers: [{ provide: ModReportesService, useValue: { getRegularData, getDeprecatedData } }],
    });
    TestBed.inject(ShellStateService).setUsuarioActivo(usuario());
    servicio = TestBed.inject(AplicativoMovilService);
  });

  it('"Uso de App" pide `APP_USO_01` por `regularData`', () => {
    servicio.usoApp(NODO).subscribe();

    expect(getDeprecatedData).not.toHaveBeenCalled();
    expect(getRegularData.mock.calls[0][0]).toBe('APP_USO_01');
  });

  /**
   * Su entrada de `cra-map.ts` NO declara `params`, así que el host manda solo
   * el nodo. El `fec` que agrega `regular()` por su cuenta no corresponde acá.
   */
  it('NO manda `fec`: su tabla no declara `params` en el mapa', () => {
    servicio.usoApp(NODO).subscribe();

    expect(getRegularData.mock.calls[0][1]).toEqual({ tip_cod: 9, cod_rel: 'FC' });
  });
});
