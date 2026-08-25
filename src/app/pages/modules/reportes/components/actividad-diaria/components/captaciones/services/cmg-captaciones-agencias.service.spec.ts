import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CmgCaptacionesAgenciasService } from './cmg-captaciones-agencias.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../../../../core/interfaces/shell-state.model';
import type { IWinderResponse } from '../../../../../../../../core/winder/winder/winder.interface';

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

describe('CmgCaptacionesAgenciasService', () => {
  let service: CmgCaptacionesAgenciasService;
  let shell: ShellStateService;
  let getRegularDataSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getRegularDataSpy = vi.fn().mockReturnValue(of(respuesta({ headers: [], body: [], additional: {} })));
    TestBed.configureTestingModule({
      providers: [{ provide: ModReportesService, useValue: { getRegularData: getRegularDataSpy } }],
    });
    service = TestBed.inject(CmgCaptacionesAgenciasService);
    shell = TestBed.inject(ShellStateService);
  });

  it('pide el bloque GCMGCAP_01 con el tip_cod/cod_rel del nodo', () => {
    shell.setUsuarioActivo(usuario({ fechaCorte: '20251130' }));

    service.obtener(NODO).subscribe();

    expect(getRegularDataSpy).toHaveBeenCalledWith('GCMGCAP_01', expect.objectContaining({ tip_cod: 2, cod_rel: 'AG01' }));
  });

  it('usa la fecha de corte del backend (`curr_fec`), no la fecha del reloj del cliente', () => {
    shell.setUsuarioActivo(usuario({ fechaCorte: '20251130' }));

    service.obtener(NODO).subscribe();

    expect(getRegularDataSpy.mock.calls[0][1].fec).toBe('20251130');
  });

  it('si el backend todavía no expuso `curr_fec`, cae a la fecha de ayer', () => {
    shell.setUsuarioActivo(usuario({ fechaCorte: undefined }));

    service.obtener(NODO).subscribe();

    expect(getRegularDataSpy.mock.calls[0][1].fec).toBe(ayerCompacto());
  });

  it('deja el semáforo detrás de la métrica que califica', () => {
    // Forma real de `GCMGCAP_01`: `TMM_Sem` (isdata 9) llega ANTES de `TMM`
    // (isdata 10), que lo absorbe con `cols: 2`.
    const headers = [
      {
        columns: [
          { columnDef: 'DESVAL', header: 'Variable', isdata: 1, cols: 1 },
          { columnDef: '7', header: 'METAS', isdata: 8, cols: 1 },
          { columnDef: '8', header: 'TMM_Sem', isdata: 9, cols: 1, hidden: true, format: { type: 'traffic-light' } },
          { columnDef: '9', header: 'TMM', isdata: 10, cols: 2 },
        ],
      },
    ];
    getRegularDataSpy.mockReturnValue(of(respuesta({ headers, body: [{ DESVAL: 'RED' }], additional: {} })));
    shell.setUsuarioActivo(usuario({ fechaCorte: '20251130' }));

    let recibido: { tabla1: { headers: { columns: { columnDef: string; isdata?: number }[] }[] } } | undefined;
    service.obtener(NODO).subscribe((r) => (recibido = r));

    const columnas = recibido!.tabla1.headers[0].columns;
    expect(columnas.map((c) => c.columnDef)).toEqual(['DESVAL', '7', '9', '8']);
    expect(columnas.find((c) => c.columnDef === '9')?.isdata).toBe(9);
    expect(columnas.find((c) => c.columnDef === '8')?.isdata).toBe(10);
  });
});
