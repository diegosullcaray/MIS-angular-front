import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { VinculacionCarteraService } from './vinculacion-cartera.service';
import { GestionPasivoComercialService } from './gestion-pasivo-comercial.service';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../core/services/shell-state.service';
import { COLUMNAS_GESTION_PASIVO_COMERCIAL } from '../models/gestion-pasivo-comercial.columnas';
import type { IWinderResponse } from '../../../../../../core/winder/winder/winder.interface';

const NODO = { tip_cod: 9, cod_rel: 'FC' };

function respuesta(resultado: Record<string, unknown>): IWinderResponse {
  return { code: '0', headers: {}, body: { resultado } } as unknown as IWinderResponse;
}

describe('Carterización de Captaciones (motor `table.regular`)', () => {
  let llamadas: { codRep: string; params: Record<string, unknown> }[];
  let cuerpo: Record<string, unknown>;

  beforeEach(() => {
    llamadas = [];
    cuerpo = { headers: '[]', data: [] };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ModReportesService,
          useValue: {
            getRegularTableResult: (codRep: string, params: Record<string, unknown>) => {
              llamadas.push({ codRep, params });
              return of(respuesta(cuerpo));
            },
          },
        },
        { provide: ShellStateService, useValue: { usuarioActivo: () => ({ fechaCorte: '20260731' }) } },
      ],
    });
  });

  it('"Vinculación Cartera" pide RS_MON_SALCAP_COM_01 con los nombres de parámetro del legado', () => {
    TestBed.inject(VinculacionCarteraService).obtener(NODO).subscribe();

    // El legado manda `tipcod`/`codrel`/`fecha` (con guiones), no `tip_cod`/`cod_rel`/`fec`.
    expect(llamadas).toEqual([{ codRep: 'RS_MON_SALCAP_COM_01', params: { tipcod: 9, codrel: 'FC', fecha: '2026-07-31' } }]);
  });

  it('"Gestión Pasivo Comercial" pide RS_CARTEPAS_01 e ignora las cabeceras del payload', () => {
    cuerpo = { headers: JSON.stringify([{ key: 'del-backend', label: 'Del backend' }]), data: [{ descripcion: 'FC' }] };

    let columnas: unknown;
    TestBed.inject(GestionPasivoComercialService)
      .obtener(NODO)
      .subscribe((t) => (columnas = t.columnas));

    expect(llamadas[0].codRep).toBe('RS_CARTEPAS_01');
    expect(columnas).toBe(COLUMNAS_GESTION_PASIVO_COMERCIAL);
  });

  it('arma las tarjetas KPI cruzando `meta1` con la variación de la fila de totales', () => {
    cuerpo = {
      headers: '[]',
      data: [{ 'var-ahorros': 1500, 'var-DPF': -200, 'var-CTS': 0 }],
      meta1: [
        { PRODUCTO: 'AHORROS', HSBSDO1: 1000 },
        { PRODUCTO: 'PLAZO FIJO', HSBSDO1: 2000 },
        { PRODUCTO: 'CTS', HSBSDO1: 3000 },
      ],
    };

    let kpis: unknown;
    TestBed.inject(VinculacionCarteraService)
      .obtener(NODO)
      .subscribe((t) => (kpis = t.kpis));

    expect(kpis).toEqual([
      { producto: 'AHORROS', saldo: 1000, variacion: 1500 },
      { producto: 'PLAZO FIJO', saldo: 2000, variacion: -200 },
      { producto: 'CTS', saldo: 3000, variacion: 0 },
    ]);
  });

  it('sin `meta1` no expone tarjetas', () => {
    let resultado: { kpis?: unknown } | undefined;
    TestBed.inject(VinculacionCarteraService)
      .obtener(NODO)
      .subscribe((t) => (resultado = t));

    expect(resultado?.kpis).toBeUndefined();
  });
});
