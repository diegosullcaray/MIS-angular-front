import { TestBed } from '@angular/core/testing';
import { of, firstValueFrom } from 'rxjs';
import { ActividadMensualRepoService } from './actividad-mensual-repo.service';
import { BloqueReporteService, type NodoConsulta } from '../../../services/bloque-reporte.service';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { TABLA_DINAMICA_VACIA, type TablaDinamicaResultado } from '../../../models/tabla-dinamica.model';

describe('ActividadMensualRepoService', () => {
  let periodos: ReturnType<typeof vi.fn>;
  let tablaRegularCon: ReturnType<typeof vi.fn>;
  let getRegularTableResult: ReturnType<typeof vi.fn>;
  let service: ActividadMensualRepoService;

  const nodo: NodoConsulta = { tip_cod: 1, cod_rel: '100' };

  beforeEach(() => {
    periodos = vi.fn().mockReturnValue(of([{ id: '2026-08', desc: 'Agosto 2026' }]));
    tablaRegularCon = vi.fn().mockReturnValue(of(TABLA_DINAMICA_VACIA));
    getRegularTableResult = vi.fn().mockReturnValue(
      of({ body: { resultado: { data: [{ HCAPMON: 100 }], headers: '[]' } } }),
    );

    TestBed.configureTestingModule({
      providers: [
        ActividadMensualRepoService,
        {
          provide: BloqueReporteService,
          useValue: {
            periodos,
            tablaRegularCon,
            fecha: () => '2026-08-28',
          },
        },
        {
          provide: ModReportesService,
          useValue: {
            getRegularTableResult,
          },
        },
      ],
    });

    service = TestBed.inject(ActividadMensualRepoService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('tableroDigitalComercial debe llamar a tablaRegularCon con RS_TAB_COM_01', async () => {
    const res = await firstValueFrom(service.tableroDigitalComercial(nodo));
    expect(tablaRegularCon).toHaveBeenCalledWith('RS_TAB_COM_01', {
      tip_cod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      fec: '2026-08-28',
    });
    expect(res).toBe(TABLA_DINAMICA_VACIA);
  });

  /**
   * Antes mandaba un `HttpContext` con un timeout de 3 min propio. Ya no hay
   * timeout que subir —el interceptor no impone ninguno—, así que la llamada
   * queda con los dos argumentos de siempre.
   */
  it('estructuraDesembolsosMensual debe llamar a tablaRegularCon con RS_DESEMB_02, sin contexto', async () => {
    const res = await firstValueFrom(service.estructuraDesembolsosMensual(nodo, '2026-08-28'));
    expect(tablaRegularCon).toHaveBeenCalledWith('RS_DESEMB_02', {
      tip_cod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      fec: '2026-08-28',
    });
    expect(res).toEqual(TABLA_DINAMICA_VACIA);
  });

  it('carteraAgricola debe llamar a RS_AGROMIX_01', async () => {
    const res = await firstValueFrom(service.carteraAgricola(nodo));
    expect(getRegularTableResult).toHaveBeenCalledWith('RS_AGROMIX_01', {
      tip_cod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      fec: '2026-08-28',
    });
    expect(res.tabla).toBeDefined();
    expect(res.totales).toBeDefined();
  });

  it('cmgCartera debe llamar a CMG_CARTERA_01 y _02', async () => {
    const res = await firstValueFrom(service.cmgCartera(nodo, 1));
    expect(getRegularTableResult).toHaveBeenCalledWith('CMG_CARTERA_01', {
      codrel: nodo.cod_rel,
      Fecha: '2026-08-28',
      tipcod: nodo.tip_cod,
      met: '1',
      prod: 1,
    });
    expect(getRegularTableResult).toHaveBeenCalledWith('CMG_CARTERA_02', {
      tipcod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      tipmet: '1',
      prod: 1,
      fec: '2026-08-28',
    });
    expect(res.tabla).toBeDefined();
    expect(res.tarjetas.length).toBe(4);
  });

  it('aplicarEstilosEstructuraDesembolsos asigna colores cronológicos según ranking en IDRango 12', async () => {
    const tablaMock: TablaDinamicaResultado = {
      columnas: [
        { key: 'DES_RANGO', label: 'Rango' },
        { key: '1_Ope', label: 'Ope 1' },
        { key: '2_Ope', label: 'Ope 2' },
        { key: '3_Ope', label: 'Ope 3' },
      ],
      filas: [
        { IDRango: 1, DES_RANGO: 'Hasta 1000', '1_Ope': 10, '2_Ope': 20, '3_Ope': 30 },
        { IDRango: 12, DES_RANGO: '% Part', '1_Ope': '25%', '2_Ope': '45%', '3_Ope': '30%' },
      ],
    };
    tablaRegularCon.mockReturnValue(of(tablaMock));
    const res = await firstValueFrom(service.estructuraDesembolsosMensual(nodo, '2026-08-28'));

    const colOpe1 = res.columnas.find((c) => c.key === '1_Ope');
    const colOpe2 = res.columnas.find((c) => c.key === '2_Ope');
    const colOpe3 = res.columnas.find((c) => c.key === '3_Ope');

    expect(colOpe1?.cellStyleFn).toBeDefined();
    // Fila regular no se colorea
    expect(colOpe1?.cellStyleFn?.(10, tablaMock.filas[0])).toBeUndefined();

    // Fila 12: 1_Ope (25%) menor -> verde (#22c55e), 3_Ope (30%) medio -> amarillo (#eab308), 2_Ope (45%) mayor -> rojo (#ef4444)
    const estilo1 = colOpe1?.cellStyleFn?.('25%', tablaMock.filas[1]);
    const estilo2 = colOpe2?.cellStyleFn?.('45%', tablaMock.filas[1]);
    const estilo3 = colOpe3?.cellStyleFn?.('30%', tablaMock.filas[1]);

    expect(estilo1?.['background-color']).toBe('#22c55e');
    expect(estilo2?.['background-color']).toBe('#ef4444');
    expect(estilo3?.['background-color']).toBe('#eab308');
  });
});
