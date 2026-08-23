import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CmgCaptacionesAgenciasService } from './cmg-captaciones-agencias.service';
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

  it('corre los semáforos una métrica: METAS se queda sin punto y TFM recupera el suyo', () => {
    // Forma real de GCMGCAP_01 (misma que DESEMP_SOC_01): el backend manda cada
    // semáforo pegado a la métrica ANTERIOR, pero colorea la SIGUIENTE.
    const semaforo = (columnDef: string, isdata: number) => ({
      columnDef,
      isdata,
      hidden: true,
      format: { type: 'traffic-light' },
    });
    const headers = [
      {
        columns: [
          { columnDef: 'age', header: 'Agencia', isdata: 1 },
          { columnDef: 'metas', header: 'METAS', isdata: 2 },
          semaforo('sem_a', 3),
          { columnDef: 'tmm', header: 'TMM', isdata: 4 },
          semaforo('sem_b', 5),
          { columnDef: 'tam', header: 'TAM', isdata: 6 },
          semaforo('sem_c', 7),
          { columnDef: 'tfm', header: 'TFM', isdata: 8 },
        ],
      },
    ];
    getRegularDataSpy.mockReturnValue(of(respuesta({ headers, body: [{ age: 'AG01' }], additional: {} })));
    shell.setUsuarioActivo(usuario({ fechaCorte: '20251130' }));

    let recibido: { tabla1: { headers: { columns: { columnDef: string; cols?: number }[] }[] } } | undefined;
    service.obtener(NODO).subscribe((r) => (recibido = r));

    const columnas = recibido!.tabla1.headers[0].columns;
    expect(columnas.map((c) => c.columnDef)).toEqual([
      'age',
      'metas',
      'tmm',
      'sem_a', // el punto que venía pegado a METAS es en realidad el de TMM
      'tam',
      'sem_b',
      'tfm',
      'sem_c', // TFM se queda con el que venía pegado a TAM
    ]);

    const porDef = new Map(columnas.map((c) => [c.columnDef, c]));
    expect(porDef.get('metas')?.cols).toBe(1); // METAS no tiene punto propio
    expect(porDef.get('tfm')?.cols).toBe(2); // TFM sí muestra el suyo
  });
});
