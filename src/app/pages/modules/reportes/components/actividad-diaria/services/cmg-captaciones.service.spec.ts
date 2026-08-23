import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CmgCaptacionesService } from './cmg-captaciones.service';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../../core/interfaces/shell-state.model';
import type { IWinderResponse } from '../../../../../../core/winder/winder/winder.interface';

const NODO = { tip_cod: 2, cod_rel: 'AG01' };

function respuesta(result: unknown): IWinderResponse {
  return { code: '0', headers: {}, body: { result } };
}

function usuario(overrides: Partial<UsuarioActivo> = {}): UsuarioActivo {
  return { id: '1', nombre: 'Ana', email: 'ana@confianza.pe', rol: 'admin-general', subsistemas: [], ...overrides };
}

/** `fec` de ayer según el reloj local, en `YYYYMMDD` — el fallback del service. */
function ayerCompacto(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

describe('CmgCaptacionesService', () => {
  let service: CmgCaptacionesService;
  let shell: ShellStateService;
  let getRegularDataSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getRegularDataSpy = vi.fn().mockReturnValue(of(respuesta({ headers: [], body: [], additional: {} })));
    TestBed.configureTestingModule({
      providers: [{ provide: ModReportesService, useValue: { getRegularData: getRegularDataSpy } }],
    });
    service = TestBed.inject(CmgCaptacionesService);
    shell = TestBed.inject(ShellStateService);
  });

  it('pide el bloque GCMGCAP_01 con el tip_cod/cod_rel del nodo', () => {
    shell.setUsuarioActivo(usuario({ fechaCorte: '20251130' }));

    service.obtenerCmgCaptaciones(NODO).subscribe();

    expect(getRegularDataSpy).toHaveBeenCalledWith('GCMGCAP_01', expect.objectContaining({ tip_cod: 2, cod_rel: 'AG01' }));
  });

  it('usa la fecha de corte del backend (`curr_fec`), no la fecha del reloj del cliente', () => {
    shell.setUsuarioActivo(usuario({ fechaCorte: '20251130' }));

    service.obtenerCmgCaptaciones(NODO).subscribe();

    expect(getRegularDataSpy.mock.calls[0][1].fec).toBe('20251130');
  });

  it('si el backend todavía no expuso `curr_fec`, cae a la fecha de ayer', () => {
    shell.setUsuarioActivo(usuario({ fechaCorte: undefined }));

    service.obtenerCmgCaptaciones(NODO).subscribe();

    expect(getRegularDataSpy.mock.calls[0][1].fec).toBe(ayerCompacto());
  });

  it('entrega el bloque tal cual lo manda el backend, sin reordenar las columnas de semáforo', () => {
    // El legado no reordena: `setdisplayedData()` solo ordena el CUERPO por
    // `isdata`, y el encabezado se renderiza en el orden recibido.
    const headers = [
      {
        columns: [
          { columnDef: 'age', header: 'Agencia', isdata: 1 },
          { columnDef: 'tmm', header: 'TMM', isdata: 2, cols: 2 },
          { columnDef: 'sem_tmm', isdata: 3, hidden: true, format: { type: 'traffic-light' } },
        ],
      },
    ];
    getRegularDataSpy.mockReturnValue(of(respuesta({ headers, body: [{ age: 'AG01' }], additional: {} })));
    shell.setUsuarioActivo(usuario({ fechaCorte: '20251130' }));

    let recibido: { tabla1: { headers: unknown } } | undefined;
    service.obtenerCmgCaptaciones(NODO).subscribe((r) => (recibido = r));

    expect(recibido!.tabla1.headers).toEqual(headers);
  });
});
